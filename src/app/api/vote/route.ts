import { ActionGetResponse, ACTIONS_CORS_HEADERS, ActionPostRequest, createPostResponse } from "@solana/actions";
import { PublicKey, Connection, Transaction, Keypair } from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { Voting } from "../../../../anchor/target/types/voting";
import IDL from "../../../../anchor/target/idl/voting.json";
import * as anchor from "@coral-xyz/anchor";



export const OPTIONS = GET
// Simple API route example; reachable at /api/hello
export async function GET(_request: Request) {
    const actionMetadata: ActionGetResponse = {
        icon:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQf43HHkxMifdLowHlt8lH1uZoITAGDgEBBHw&s",
        title:"Vote for your favorite pizza",
        description:"Vote between Pepperoni and Work Pizza",
        label:"Vote",
        links: {
            actions: [
                {
                    type: "post",
                    label:"Vote for Pepperoni",
                    href:"/api/vote?candidate=Pepperoni"
                },
                {
                    type: "post",
                    label:"Vote for Work Pizza",
                    href:"/api/vote?candidate=Work Pizza"
                }
            ]
        }
    };
    return Response.json(actionMetadata, {headers: ACTIONS_CORS_HEADERS});
}

export async function POST(request: Request) {
    
    const url = new URL(request.url);
    const candidate = url.searchParams.get("candidate");
    if (!candidate) {
        return Response.json({error:"Candidate is required"}, {status: 400, headers: ACTIONS_CORS_HEADERS}); // need futher explainations
    }
    if (candidate !== "Pepperoni" && candidate !== "Work Pizza") {
        return Response.json({error:"Invalid candidate"}, {status: 400, headers: ACTIONS_CORS_HEADERS});
    }

    const connection = new Connection("http://127.0.0.1:8899", "confirmed"); // commitment status
    //const program: Program<Voting>= new Program(IDL, {connection});
    const body: ActionPostRequest = await request.json();
    let voter;

    try {
        voter = new PublicKey(body.account);
    } catch (error) {
        return Response.json({error:"Invalid voter"}, {status: 400, headers: ACTIONS_CORS_HEADERS});
    }

    const pollId = new anchor.BN(1);


    // Create a dummy keypair for the provider (not used for signing, just for instruction building)
    const dummyKeypair = Keypair.generate();
    const provider = new AnchorProvider(connection, {
        publicKey: dummyKeypair.publicKey,
        signTransaction: async (tx) => tx,
        signAllTransactions: async (txs) => txs,
    }, { commitment: "confirmed" });
    
    const program = new Program<Voting>(IDL, provider);

    const blockhash = await connection.getLatestBlockhash(); // why do we need to get the latest blockhash?

    const transaction = new Transaction({
        feePayer: voter,
        blockhash: blockhash.blockhash,
        lastValidBlockHeight: blockhash.lastValidBlockHeight,
    });

    const instruction = await program.methods
        .vote(candidate, pollId)
        .accounts({
            signer: voter
        })
        .instruction();
    
    transaction.add(instruction);

    const response = await createPostResponse({
        fields: {
            type: "transaction",
            transaction: transaction
        }
    });

    return Response.json(response, {headers: ACTIONS_CORS_HEADERS});
}