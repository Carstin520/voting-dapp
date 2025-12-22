/// <reference types="jest" />
import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Keypair, PublicKey } from '@solana/web3.js';
import {Voting} from '../target/types/voting';
import { startAnchor } from 'solana-bankrun';
import { BankrunProvider } from 'anchor-bankrun';

const IDL = require('../target/idl/voting.json');

const votingAddress = new PublicKey("Count3AcZucFDPSFBAeHkQ6AvttieKUkyJ8HiQGhQwe");

describe('Voting', () => {
  
  let context;
  let provider;
  let votingProgram;

  beforeAll(async () => {
    context = await startAnchor("", [{name: "voting", programId: votingAddress}], []);
    provider = new BankrunProvider(context);
    votingProgram = new Program<Voting>(IDL, provider); 
  })

  it('Initialize Poll', async () => {
    await votingProgram.methods.initializePoll(
      new anchor.BN(1), // poll id
      new anchor.BN(0), // poll start
      new anchor.BN(1865093344), // poll end
      "What is your favorite type of pizza?", // description  
    ).rpc();


    // Get the poll address
    const [pollAddress] = PublicKey.findProgramAddressSync([new anchor.BN(1).toArrayLike(Buffer, "le", 8)], votingAddress);

    // Get the poll account
    const pollAccount = await votingProgram.account.poll.fetch(pollAddress);

    expect(pollAccount.pollId.toNumber()).toBe(1);
    expect(pollAccount.description).toBe("What is your favorite type of pizza?");
    expect(pollAccount.pollStart.toNumber()).toBe(0);
    expect(pollAccount.pollEnd.toNumber()).toBe(1865093344);
    expect(pollAccount.candidateAmount.toNumber()).toBe(0);
  });

   it('Initialize Candidate', async () => {

    await votingProgram.methods.initializeCandidate(
      "Pepperoni", // candidate name
      new anchor.BN(1), // poll id
    ).rpc();

    await votingProgram.methods.initializeCandidate(
      "Work Pizza", // candidate name
      new anchor.BN(1), // poll id
    ).rpc();

    const [PepperoniAddress] = PublicKey.findProgramAddressSync([new anchor.BN(1).toArrayLike(Buffer, "le", 8), Buffer.from("Pepperoni")], votingAddress);
    const PepperoniAccount = await votingProgram.account.candidate.fetch(PepperoniAddress);

    expect(PepperoniAccount.candidateName).toBe("Pepperoni");
    expect(PepperoniAccount.candidateVotes.toNumber()).toBe(0);

    const [WorkPizzaAddress] = PublicKey.findProgramAddressSync([new anchor.BN(1).toArrayLike(Buffer, "le", 8), Buffer.from("Work Pizza")], votingAddress);
    const WorkPizzaAccount = await votingProgram.account.candidate.fetch(WorkPizzaAddress);

    expect(WorkPizzaAccount.candidateName).toBe("Work Pizza");
    expect(WorkPizzaAccount.candidateVotes.toNumber()).toBe(0);
  });

  it('Vote', async () => {
    await votingProgram.methods.vote(
      "Pepperoni", // candidate name
      new anchor.BN(1), // poll id
    ).rpc();

    const [PepperoniAddress] = PublicKey.findProgramAddressSync([new anchor.BN(1).toArrayLike(Buffer, "le", 8), Buffer.from("Pepperoni")], votingAddress);
    const PepperoniAccount = await votingProgram.account.candidate.fetch(PepperoniAddress);

    expect(PepperoniAccount.candidateName).toBe("Pepperoni");
    expect(PepperoniAccount.candidateVotes.toNumber()).toBe(1);
  });
});
