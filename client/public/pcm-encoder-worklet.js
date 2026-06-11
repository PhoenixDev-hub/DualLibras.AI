class PCMEncoderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // 480 samples = 30 ms of audio at 16000 Hz
    this.chunkSize = 480;
    this.buffer = new Int16Array(this.chunkSize);
    this.bufferPtr = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const channel = input[0];
    for (let i = 0; i < channel.length; i++) {
      // Scale float32 [-1.0, 1.0] to int16 [-32768, 32767]
      const sample = Math.max(-1, Math.min(1, channel[i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      this.buffer[this.bufferPtr++] = Math.round(intSample);

      if (this.bufferPtr >= this.chunkSize) {
        // Post the raw PCM 16-bit buffer back to main thread
        // We use transferables to avoid copying overhead
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
