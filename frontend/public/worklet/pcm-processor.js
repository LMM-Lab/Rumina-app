class PCMProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (input.length > 0) {
            const channelData = input[0]; // Mono
            const pcmCopy = new Float32Array(channelData.length);
            pcmCopy.set(channelData);

            this.port.postMessage({
                type: 'audio',
                pcm: pcmCopy
            });
        }
        return true;
    }
}

registerProcessor('pcm-processor', PCMProcessor);
