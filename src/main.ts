function init(): WebGL2RenderingContext {
  const canvas = document.getElementById('glCanvas') as HTMLCanvasElement | null;

  if (!canvas) {
    throw new Error('Canvas element with id "glCanvas" not found.');
  }

  const gl = canvas.getContext('webgl2');
  if (!gl) {
    throw new Error('WebGL2 not supported in this browser.');
  }

  return gl;
}

function run() {
  const gl = init();

  const bufferSizesMB = [1, 4, 10, 20, 50, 100];
  const iterations = 100;

  const allResults: Map<number, number[]> = new Map();

  for (const sizeInMB of bufferSizesMB) {
    console.log(`\n--- Testing ${sizeInMB}MB buffers ---`);
    const byteLength = sizeInMB * 1024 * 1024;
    const numFloats = byteLength / 4;

    const warmup = 5;
    console.log(`Warming up (${warmup} runs)...`);
    for (let i = 0; i < warmup; i++) {
      const data = new Float32Array(numFloats);
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    }

    const times: number[] = [];

    console.log(`Starting ${sizeInMB}MB run...`);
    for (let i = 0; i < iterations; i++) {
      const data = new Float32Array(numFloats);
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

      const start = performance.now();
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      const end = performance.now();
      const duration = end - start;

      console.log(`Buffer ${sizeInMB}MB - iter ${i + 1}: ${duration.toFixed(3)} ms`);
      times.push(duration);
    }

    allResults.set(sizeInMB, times);

    times.sort((a, b) => a - b);
    const mean = times.reduce((a, b) => a + b, 0) / times.length;
    const stddev = Math.sqrt(
      times.map(x => (x - mean) ** 2).reduce((a, b) => a + b, 0) / times.length
    );
    const min = times[0];
    const max = times[times.length - 1];
    const median = times[Math.floor(times.length / 2)];

    console.log(`\n[${sizeInMB}MB summary]`);
    console.log(`iterations: ${iterations}`);
    console.log(`mean: ${mean.toFixed(3)} ms`);
    console.log(`std dev: ${stddev.toFixed(3)} ms`);
    console.log(`min: ${min.toFixed(3)} ms`);
    console.log(`max: ${max.toFixed(3)} ms`);
    console.log(`median: ${median.toFixed(3)} ms`);
    // TODO: save to csv
  }
}

run();
