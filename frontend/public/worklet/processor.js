class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this._buffer = [];
        this._targetSize = 320; // 約20ms相当
    }

    process(inputs) {
        const input = inputs[0];
        if (input.length > 0) {
            const channelData = input[0];
            this._buffer.push(...channelData);

            if (this._buffer.length >= this._targetSize) {
                const chunk = this._buffer.slice(0, this._targetSize);
                this._buffer = this._buffer.slice(this._targetSize);

                const int16Buffer = new Int16Array(chunk.length);
                for (let i = 0; i < chunk.length; i++) {
                    const s = Math.max(-1, Math.min(1, chunk[i]));
                    int16Buffer[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }
                this.port.postMessage({
                    type: 'audio',
                    buffer: int16Buffer.buffer,
                });
            }
        }
        return true;
    }
}

registerProcessor('audio-processor', AudioProcessor);
