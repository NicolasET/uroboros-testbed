# Reference implementation

A truth-conforming implementation of the scenario (`scenario/truth.md`), used only by `harness/verify.test.ts` to prove the hidden tests are satisfiable. Never shown to uroboros. The files here replace their namesakes in `fixture/src/`, including the server's route table (`gateway.ts`), so the hidden runtime tests pass too.
