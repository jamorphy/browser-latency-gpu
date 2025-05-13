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

function reset(gl: WebGL2RenderingContext) {
  console.log('resetting gl context');
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  gl.useProgram(null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function benchBufferUpload(gl: WebGL2RenderingContext) {
  const bufferSizesMB = [1, 4, 10, 20, 50, 100];
  const iterations = 100;

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

function benchDrawCalls(gl: WebGL2RenderingContext) {
  const iterations = 100;
  const numDrawCallsPerIter = 1000;

  const vertices = new Float32Array([
    -0.01, -0.01,
    0.01,  -0.01,
    0.0,    0.01
  ]);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  const vSource = `
    attribute vec2 position;
    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const fSource = `
    void main() {
      gl_FragColor = vec4(1.0);
    }
  `;

  const vs = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vs, vSource);
  gl.compileShader(vs);
  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fs, fSource);
  gl.compileShader(fs);

  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.useProgram(program);

  const positionLocation = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  const results: number[] = [];

  // spam draw calls
  // TODO: is this even effective
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    for (let j = 0; j < numDrawCallsPerIter; j++) {
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    gl.finish();
    const end = performance.now();
    const duration = end - start;
    results.push(duration);
    console.log(`Iteration ${i + 1}: ${duration.toFixed(3)} ms`);
  }

  const mean = results.reduce((a, b) => a + b, 0) / results.length;
  const stddev = Math.sqrt(results.map(x => (x - mean) ** 2).reduce((a, b) => a + b, 0) / results.length);
  results.sort((a, b) => a - b);
  const min = results[0];
  const max = results[results.length - 1];
  const median = results[Math.floor(results.length / 2)];

  console.log(`Draw calls summary (${numDrawCallsPerIter} calls/iter)`);
  console.log(`iterations: ${iterations}`);
  console.log(`mean: ${mean.toFixed(3)} ms`);
  console.log(`std dev: ${stddev.toFixed(3)} ms`);
  console.log(`min: ${min.toFixed(3)} ms`);
  console.log(`max: ${max.toFixed(3)} ms`);
  console.log(`median: ${median.toFixed(3)} ms`);
}

function run() {
  const gl = init();
  
  const allResults: Map<number, number[]> = new Map();

  benchBufferUpload(gl);
  reset(gl);
  benchDrawCalls(gl);
  reset(gl);
  
}

run();
