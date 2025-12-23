#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("D6z5LC9s3RWroyUhernuRYaKhY5SMSB28LMemLhorpdA");

#[program]
pub mod voting {
    use super::*;

    pub fn initialize_poll(ctx: Context<InitializePoll>, poll_id: u64, poll_start: u64, poll_end: u64, description: String) -> Result<()> {

        let poll = &mut ctx.accounts.poll;

        poll.poll_id = poll_id;
        poll.description = description;
        poll.poll_start = poll_start;
        poll.poll_end = poll_end;
        poll.candidate_amount = 0; // initialize with 0 candidates

        msg!("Poll initialized successfully");

        Ok(())
    }
    
    pub fn initialize_candidate(ctx: Context<InitializeCandidate>, candidate_name: String, _poll_id: u64) -> Result<()> {
        let candidate = &mut ctx.accounts.candidate;
        let poll = &mut ctx.accounts.poll;
        poll.candidate_amount += 1;
        candidate.candidate_name = candidate_name;
        candidate.candidate_votes = 0;

        msg!("Candidate initialized successfully");

        Ok(())
    }

    pub fn vote(ctx: Context<Vote>, _candidate_name: String, _poll_id: u64) -> Result<()> {
        let candidate = &mut ctx.accounts.candidate;
        candidate.candidate_votes += 1;

        msg!("Candidate: {}", candidate.candidate_name);
        msg!("Votes: {}", candidate.candidate_votes);
        msg!("Candidate voted successfully");
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(candidate_name: String, poll_id: u64)]
pub struct Vote<'info> {

    pub signer: Signer<'info>,

    #[account(
        seeds= [poll_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub poll: Account<'info, Poll>,

    #[account(
        mut,
        seeds= [poll_id.to_le_bytes().as_ref(), candidate_name.as_bytes().as_ref()],
        bump,
    )]
    pub candidate: Account<'info, Candidate>,
}

#[derive(Accounts)]
#[instruction(candidate_name: String, poll_id: u64)]
pub struct InitializeCandidate<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds= [poll_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub poll: Account<'info, Poll>,

    #[account(
        init,
        payer=signer,
        space= 8 + Candidate::INIT_SPACE,
        seeds= [poll_id.to_le_bytes().as_ref(), candidate_name.as_bytes().as_ref()], // seeds are used to derive the candidate account address
        bump,
    )]
    pub candidate: Account<'info, Candidate>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Candidate {
    #[max_len(32)]
    pub candidate_name: String,
    pub candidate_votes: u64,
}

#[derive(Accounts)]
#[instruction(poll_id: u64)]
pub struct InitializePoll<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init,
        payer=signer,
        space= 8 + Poll::INIT_SPACE,
        seeds= [poll_id.to_le_bytes().as_ref()], // seeds are used to derive the poll account address
        bump,
    )]
    pub poll: Account<'info, Poll>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Poll {
    pub poll_id: u64,
    #[max_len(280)]
    pub description: String,
    pub poll_start: u64,
    pub poll_end: u64,
    pub candidate_amount: u64,
}