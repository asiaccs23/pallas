import { BIG, ECP } from "amcl-js";
import { Rng } from "ecc";
import { B2, Theta, ThetaOnly } from "groth-sahai";

import { Ballot, FirstBallot } from "./Ballot";
import { constants } from "./constants";
import { PublicElection } from "./PublicElection";
import { serializeVerificationKey, UserVerificationKey } from "./UserKeypair";

const { ctx, g1, g2, n } = constants;

export class Randomizer {
  private readonly rng: Rng;
  private readonly election: PublicElection;

  public constructor(rng: Rng, election: PublicElection) {
    this.rng = rng;
    this.election = election;
  }

  public randomizefirst(upk: UserVerificationKey, { c0, sigma0 }: FirstBallot): Ballot {
    const { c1, c2, c3, T, C } = c0;
    const { pi_r, pi_T, pi_V, pi_M } = c0.pi;
    const { sigma1, sigma2, sigma3, sigma4, sigma5 } = sigma0;
    const { P } = this.election.epk;

    const rPrime = this.rng.makeFactor();
    const sPrime = this.rng.makeFactor();
    const rPrimeSPrime = ctx.BIG.modmul(rPrime, sPrime, n);

    const c1Prime = new ctx.ECP(c1);
    c1Prime.add(g1.mul(rPrime));

    const c2Prime = new ctx.ECP(c2);
    c2Prime.add(this.election.epk.P.mul(rPrime));

    const c3Prime = new ctx.ECP(c3);
    c3Prime.add(this.election.H(serializeVerificationKey(upk)).mul(rPrime));

    const TPrime = new ctx.ECP(T);
    TPrime.add(upk.X1.mul(rPrime));

    const sigma1Prime = new ctx.ECP(sigma1);
    sigma1Prime.add(c1.mul(sPrime));
    sigma1Prime.add(sigma3.mul(rPrime));
    sigma1Prime.add(g1.mul(rPrimeSPrime));

    const sigma2Prime = new ctx.ECP(sigma2);
    sigma2Prime.add(c2.mul(sPrime));
    sigma2Prime.add(sigma5.mul(rPrime));
    sigma2Prime.add(P.mul(rPrimeSPrime));

    const sigma3Prime = new ctx.ECP(sigma3);
    sigma3Prime.add(g1.mul(sPrime));

    const sigma4Prime = new ctx.ECP2(sigma4);
    sigma4Prime.add(g2.mul(sPrime));

    const sigma5Prime = new ctx.ECP(sigma5);
    sigma5Prime.add(P.mul(sPrime));

    /** Commitment to the scalar r' */
    const rand = this.rng.makeFactor();
    const [commitmentToRPrime] = this.election.epk.gs.commitScalarInG2([rPrime], [rand]);

    /** Commitment to the scalar r+r' */
    const C_rPrime: B2 = [new ctx.ECP2(C.C_r[0]), new ctx.ECP2(C.C_r[1])];
    C_rPrime[0].add(commitmentToRPrime[0]);
    C_rPrime[1].add(commitmentToRPrime[1]);

    const pi_rPrime = this.randomizedProof(pi_r, [g1], [rand]);
    const pi_TPrime = this.randomizedProof(pi_T, [upk.X1], [rand]);
    const Hvk = this.election.H(serializeVerificationKey(upk));
    const pi_VPrime = this.randomizedProof(pi_V, [Hvk], [rand]);
    const pi_MPrime = this.randomizedProof(pi_M, [this.election.epk.P], [rand]);

    return {
      c: {
        c1: c1Prime,
        c2: c2Prime,
        c3: c3Prime,
        T: TPrime,
        C: {
          C_r: C_rPrime,
          C_2m: c0.C.C_2m, // TODO: do we need to randomize this?
          C_2m_square: c0.C.C_2m_square, // TODO: do we need to randomize this?
        },
        pi: {
          pi_r: pi_rPrime,
          pi_m: c0.pi.pi_m, // TODO: do we need to randomize this?
          pi_M: pi_MPrime,
          pi_T: pi_TPrime,
          pi_V: pi_VPrime,
        },
      },
      sigma: {
        sigma1: sigma1Prime,
        sigma2: sigma2Prime,
        sigma3: sigma3Prime,
        sigma4: sigma4Prime,
        sigma5: sigma5Prime,
      },
    };
  }

  public randomize(upk: UserVerificationKey, { c, sigma }: Ballot): Ballot {
    const { c1, c2, c3, T, C } = c;
    const { pi_r, pi_T, pi_V, pi_M } = c.pi;
    const { sigma1, sigma2, sigma3, sigma4, sigma5 } = sigma;
    const { P } = this.election.epk;

    const rPrime = this.rng.makeFactor();
    const sPrime = this.rng.makeFactor();
    const rPrimeSPrime = ctx.BIG.modmul(rPrime, sPrime, n);

    const c1Prime = new ctx.ECP(c1);
    c1Prime.add(g1.mul(rPrime));

    const c2Prime = new ctx.ECP(c2);
    c2Prime.add(this.election.epk.P.mul(rPrime));

    const c3Prime = new ctx.ECP(c3);
    c3Prime.add(this.election.H(serializeVerificationKey(upk)).mul(rPrime));

    const TPrime = new ctx.ECP(T);
    TPrime.add(upk.X1.mul(rPrime));

    const sigma1Prime = new ctx.ECP(sigma1);
    sigma1Prime.add(c1.mul(sPrime));
    sigma1Prime.add(sigma3.mul(rPrime));
    sigma1Prime.add(g1.mul(rPrimeSPrime));

    const sigma2Prime = new ctx.ECP(sigma2);
    sigma2Prime.add(c2.mul(sPrime));
    sigma2Prime.add(sigma5.mul(rPrime));
    sigma2Prime.add(P.mul(rPrimeSPrime));

    const sigma3Prime = new ctx.ECP(sigma3);
    sigma3Prime.add(g1.mul(sPrime));

    const sigma4Prime = new ctx.ECP2(sigma4);
    sigma4Prime.add(g2.mul(sPrime));

    const sigma5Prime = new ctx.ECP(sigma5);
    sigma5Prime.add(P.mul(sPrime));

    /** Commitment to the scalar r' */
    const rand = this.rng.makeFactor();
    const [commitmentToRPrime] = this.election.epk.gs.commitScalarInG2([rPrime], [rand]);

    /** Commitment to the scalar r+r' */
    const C_rPrime: B2 = [new ctx.ECP2(C.C_r[0]), new ctx.ECP2(C.C_r[1])];
    C_rPrime[0].add(commitmentToRPrime[0]);
    C_rPrime[1].add(commitmentToRPrime[1]);

    const pi_rPrime = this.randomizedProof(pi_r, [g1], [rand]);
    const pi_TPrime = this.randomizedProof(pi_T, [upk.X1], [rand]);
    const Hvk = this.election.H(serializeVerificationKey(upk));
    const pi_VPrime = this.randomizedProof(pi_V, [Hvk], [rand]);
    const pi_MPrime = this.randomizedProof(pi_M, [this.election.epk.P], [rand]);

    return {
      c: {
        c1: c1Prime,
        c2: c2Prime,
        c3: c3Prime,
        T: TPrime,
        C: {
          C_r: C_rPrime,
          C_2m: c.C.C_2m, // TODO: do we need to randomize this?
          C_2m_square: c.C.C_2m_square, // TODO: do we need to randomize this?
        },
        pi: {
          pi_r: pi_rPrime,
          pi_m: c.pi.pi_m, // TODO: do we need to randomize this?
          pi_M: pi_MPrime,
          pi_T: pi_TPrime,
          pi_V: pi_VPrime,
        },
      },
      sigma: {
        sigma1: sigma1Prime,
        sigma2: sigma2Prime,
        sigma3: sigma3Prime,
        sigma4: sigma4Prime,
        sigma5: sigma5Prime,
      },
    };
  }

  /**
   * Takes a proof of `T1 = X * r` and creates a proof for `T1' = X * r + A * r'`
   * by taking A and the randomnes used for comitting r'
   *
   * @param A a vector of elements in G1 (public) that is the same for the old and the new proof
   * @param s the randomness used to commit r'
   */
  private randomizedProof(original: ThetaOnly, A: readonly ECP[], s: readonly BIG[]): ThetaOnly {
    /** A proof for T1 = A * r' */
    const theta2 = this.election.epk.gs.proveMultiScalarLinear1(A, s).theta;

    const updatedTheta: Theta = [new ctx.ECP(original.theta[0]), new ctx.ECP(original.theta[1])];
    updatedTheta[0].add(theta2[0]);
    updatedTheta[1].add(theta2[1]);

    return { theta: updatedTheta };
  }
}
