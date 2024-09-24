import { AudioStream } from "@aws-sdk/client-transcribe-streaming";

export class AsyncAudioInputStream implements AsyncIterable<AudioStream> {
    private buffer: Uint8Array[] = [];
    private closed = false;
  
    public async *[Symbol.asyncIterator](): AsyncIterator<AudioStream> {
      while (!this.closed || this.buffer.length > 0) {
        if (this.buffer.length > 0) {
          const chunk = this.buffer.shift() as Uint8Array;
          yield { AudioEvent: { AudioChunk: chunk } };
        } else {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
    }
  
    public push(data: ArrayBuffer): void {
      this.buffer.push(new Uint8Array(data));
    }
  
    public close(): void {
      this.closed = true;
    }
  }
  