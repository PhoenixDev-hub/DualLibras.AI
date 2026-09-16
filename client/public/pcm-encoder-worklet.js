class PCMEncoderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.chunkSize = 480;
    this.buffer = new Int16Array(this.chunkSize);
    this.bufferPtr = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const channel = input[0];
    for (let i = 0; i < channel.length; i++) {
      const sample = Math.max(-1, Math.min(1, channel[i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      this.buffer[this.bufferPtr++] = Math.round(intSample);

      if (this.bufferPtr >= this.chunkSize) {
        const copy = new Int16Array(this.buffer);
        this.port.postMessage({
          type: 'audio',
          buffer: copy.buffer
        }, [copy.buffer]);
        this.bufferPtr = 0;
      }
    }

    return true;
  }
}

registerProcessor('pcm-encoder', PCMEncoderProcessor);
