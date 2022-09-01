/* eslint-disable no-console */
import { Rng } from "ecc";

import { Ballot, FirstBallot } from "./Ballot";
import { BallotVerifier } from "./BallotVerifier";
import { constants } from "./constants";
import { makeElectionKeypair } from "./ElectionKeypair";
import { Message, intToMessage } from "./Message";
import { PublicElection } from "./PublicElection";
import { Publisher } from "./Publisher";
import { Randomizer } from "./Randomizer";
import { Trustee } from "./Trustee";
import { makeUserKeypair } from "./UserKeypair";
import { VoteEncryptor } from "./VoteEncryptor";

const { ctx } = constants;

function fromHex(hex: string): Uint8Array {
  return new Uint8Array([...Buffer.from(hex, "hex")]);
}

describe("Pallas test", () => {
  // a very poor seed, don't copy into production code
  const defaultSeed = fromHex("aabbccddeeff00112233445566778899");

    const rng = new Rng(ctx, defaultSeed);

    var b0 : FirstBallot;
    var b0Prime : Ballot;

    const k = 2;
    const electionKeypair = makeElectionKeypair(rng, k);

    const election = new PublicElection(electionKeypair.pk, k);
    const verifier = new BallotVerifier(election);
    const randomizer = new Randomizer(rng, election);

    const userKeypair = makeUserKeypair(rng, electionKeypair.pk);

    // User registers their public key

    const encryptor = new VoteEncryptor(rng, election, userKeypair);
    const m: Message = Array.from({ length: k }).map(
      () => Math.floor(Math.random() + 0.5) as 0 | 1,
    );
  it("Time to generate first ballot", () => {
    const c0 = encryptor.encryptFirst(intToMessage(0, k));
    const sigma0 = encryptor.sign(c0);
    b0 = { c0, sigma0 };
  });
    
  it("Time to generate a randomization", () => {
    b0Prime = randomizer.randomizefirst(userKeypair.vk, b0);
  });

  it("Time to verify first ballot", () => {
    expect(verifier.verifyFirstBallot(userKeypair.vk, b0)).toEqual(true);
  });
  it("Time to verify a ballot", () => {
    expect(verifier.verifyPlus(userKeypair.vk, b0Prime)).toEqual(true);
  });

  it("Time to generate a ballot", () => {
     const c = encryptor.encryptPlus(m);
     const sigma = encryptor.sign(c);
     const b: Ballot = { c, sigma };
   });
 //const bSecond = randomizer.randomize(userKeypair.vk, b0Prime);

    // expect(verifier.verifyPlus(userKeypair.vk, bSecond)).toEqual(true);
    // expect(verifier.verifyPlus(userKeypair.vk, bPrime)).toEqual(true);

    // const publisher = new Publisher();
    // const pb = publisher.publish(b);

    // const trustee = new Trustee(electionKeypair, k);

    // const decryptedB = trustee.decryptPlus(b);
    // expect(decryptedB).toEqual(m);
    // const decryptedBPrime = trustee.decryptPlus(bPrime);
    // expect(decryptedBPrime).toEqual(m);
    // const decryptedPB = trustee.decryptPlus(pb);
    // expect(decryptedPB).toEqual(m);
  });
