const canvas = document.getElementById('shader-canvas');
const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

if (!gl) {
    console.error("WebGL not supported!");
    canvas.style.display = 'none';
    document.body.style.backgroundColor = '#000';
}

// --- GLSL Shader Code ---

const vertexShaderSource = `#version 300 es
    in vec2 a_position;
    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
    }
`;

const fragmentShaderSource = `#version 300 es
    precision highp float;
    
    uniform vec2 iResolution;
    uniform float iTime;

    out vec4 fragColor;

    // --- Green & Black Color Palette ---
    const vec3 COLOR_CHECK1 = vec3(0.0, 0.0, 0.0);      // Black
    const vec3 COLOR_CHECK2 = vec3(0.0, 0.2, 0.0);      // Dark Green
    const vec3 COLOR_SCANLINE = vec3(0.0, 0.05, 0.0);   // Very Dark Green

    void main() {
        // Center and correct aspect ratio
        vec2 uv = (gl_FragCoord.xy * 2.0 - iResolution.xy) / iResolution.y;
        
        // --- Checkered Pattern ---
        vec2 check_uv = uv * 15.0; // Scale the checkers
        vec2 i_uv = floor(check_uv);
        float check = mod(i_uv.x + i_uv.y, 2.0);
        vec3 finalColor = mix(COLOR_CHECK1, COLOR_CHECK2, check);

        // --- CRT Scan Lines ---
        float scanLineY = uv.y * 200.0;
        float scanLine = sin(scanLineY) * 0.5 + 0.5;
        finalColor *= mix(0.8, 1.2, scanLine); // Modulate brightness

        // --- Vignette ---
        float vignette = length(uv * 0.9);
        finalColor *= 1.0 - pow(vignette, 4.0);

        // --- Chromatic Aberration (subtle) ---
        // This simulates the effect by slightly shifting color channels.
        finalColor.r += 0.02 * (1.0 - vignette);
        finalColor.b += 0.01 * (1.0 - vignette);

        fragColor = vec4(finalColor, 1.0);
    }
`;

// --- WebGL Setup and Rendering ---

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { return shader; }
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) { return program; }
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vertexShader, fragmentShader);

const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
const resolutionUniformLocation = gl.getUniformLocation(program, "iResolution");
const timeUniformLocation = gl.getUniformLocation(program, "iTime");

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
const positions = [ -1, -1, 1, -1, -1,  1, -1,  1, 1, -1, 1,  1 ];
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

const vao = gl.createVertexArray();
gl.bindVertexArray(vao);
gl.enableVertexAttribArray(positionAttributeLocation);
gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

function render(time) {
    time *= 0.001;

    const displayWidth  = gl.canvas.clientWidth;
    const displayHeight = gl.canvas.clientHeight;
    if (gl.canvas.width !== displayWidth || gl.canvas.height !== displayHeight) {
        gl.canvas.width  = displayWidth;
        gl.canvas.height = displayHeight;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    }

    gl.useProgram(program);
    gl.bindVertexArray(vao);

    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(timeUniformLocation, time);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    requestAnimationFrame(render);
}

requestAnimationFrame(render);

