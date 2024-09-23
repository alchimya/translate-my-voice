// audio-processor.js
class AudioProcessor extends AudioWorkletProcessor {
    process(inputs, outputs, parameters) {
      const input = inputs[0]; // Get the first input channel
      if (input.length > 0) {
        const channelData = input[0]; // Get the first channel data
        // Send the audio data to the main thread
        this.port.postMessage(channelData);
      }
      return true; // Keep the processor alive
    }
  }
  
  registerProcessor('audio-processor', AudioProcessor);
  