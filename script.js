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

    const vec3 COLOR_CHECK1 = vec3(0.0, 0.0, 0.0);
    const vec3 COLOR_CHECK2 = vec3(0.0, 0.2, 0.0);
    const vec3 COLOR_SCANLINE = vec3(0.0, 0.05, 0.0);

    void main() {
        vec2 uv = (gl_FragCoord.xy * 2.0 - iResolution.xy) / iResolution.y;
        
        vec2 wavy_uv = uv;
        wavy_uv.x += sin(uv.y * 5.0 + iTime * 0.5) * 0.1;
        wavy_uv.y += cos(uv.x * 5.0 + iTime * 0.5) * 0.1;

        vec2 check_uv = wavy_uv * 8.0;
        vec2 i_uv = floor(check_uv);
        float check = mod(i_uv.x + i_uv.y, 2.0);
        vec3 finalColor = mix(COLOR_CHECK1, COLOR_CHECK2, check);

        float scanLineY = uv.y * 200.0;
        float scanLine = sin(scanLineY) * 0.5 + 0.5;
        finalColor *= mix(0.8, 1.2, scanLine);

        finalColor.r += 0.02;
        finalColor.b += 0.01;

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


// --- Art Gallery Modal Logic ---
const modal = document.getElementById('art-modal');
const modalImg = document.getElementById('modal-image');
const galleryItems = document.querySelectorAll('.gallery-item');
const closeModal = document.querySelector('.close-btn');

galleryItems.forEach(item => {
    item.addEventListener('click', () => {
        modal.style.display = "flex";
        modalImg.src = item.src;
    });
});

closeModal.addEventListener('click', () => {
    modal.style.display = "none";
});

window.addEventListener('click', (event) => {
    if (event.target == modal) {
        modal.style.display = "none";
    }
});


// --- Music Player Logic ---
const musicPlayer = document.getElementById('music-player');
const navBar = document.getElementById('player-nav-bar');
const playPauseBtn = document.getElementById('play-pause-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const seekBar = document.getElementById('seek-bar');
const volumeBar = document.getElementById('volume-bar');
const trackInfo = document.getElementById('track-info');

const audio = new Audio();
let songIndex = 0;

// --- IMPORTANT: Add your music files here ---
// You need to have a 'music' folder with these files, or change the URLs.
const playlist = [
    { title: "41 minutes of Roblox music", src: "music/41 minutes of Roblox music.mp3" },
    { title: "ROBLOX Music - Horror", src: "https://www.youtube.com/watch?v=dBvlnyvgOnw&list=PL_QAYO7uu9X-EE9tHe4OSeFlo3VJTkELv&index=4" },
    { title: "01. Roblox Soundtrack - The Main Theme", src: "https://www.youtube.com/watch?v=V-r0mN-twIU&list=PL59n1-Hz11F--hI9Qz6AIyKUoBUeMRkFH&index=1" }
];

function loadSong(song) {
    trackInfo.textContent = song.title;
    audio.src = song.src;
}

function playSong() {
    musicPlayer.classList.add('playing');
    playPauseBtn.classList.add('playing');
    audio.play();
}

function pauseSong() {
    musicPlayer.classList.remove('playing');
    playPauseBtn.classList.remove('playing');
    audio.pause();
}

function prevSong() {
    songIndex--;
    if (songIndex < 0) {
        songIndex = playlist.length - 1;
    }
    loadSong(playlist[songIndex]);
    playSong();
}

function nextSong() {
    songIndex++;
    if (songIndex > playlist.length - 1) {
        songIndex = 0;
    }
    loadSong(playlist[songIndex]);
    playSong();
}

function updateProgress(e) {
    const { duration, currentTime } = e.srcElement;
    const progressPercent = (currentTime / duration) * 100;
    seekBar.value = isNaN(duration) ? 0 : currentTime;
}

function setProgress(e) {
    audio.currentTime = e.target.value;
}

function setVolume(e) {
    audio.volume = e.target.value;
}

// Event Listeners for player
playPauseBtn.addEventListener('click', () => {
    const isPlaying = musicPlayer.classList.contains('playing');
    if (isPlaying) {
        pauseSong();
    } else {
        playSong();
    }
});

prevBtn.addEventListener('click', prevSong);
nextBtn.addEventListener('click', nextSong);
audio.addEventListener('timeupdate', updateProgress);
audio.addEventListener('loadedmetadata', () => {
    seekBar.max = audio.duration;
});
audio.addEventListener('ended', nextSong);
seekBar.addEventListener('input', setProgress);
volumeBar.addEventListener('input', setVolume);

// Draggable nav bar logic
let isDragging = false;
let offsetX, offsetY;

navBar.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - musicPlayer.offsetLeft;
    offsetY = e.clientY - musicPlayer.offsetTop;
    musicPlayer.style.cursor = 'grabbing';
    e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    musicPlayer.style.left = `${e.clientX - offsetX}px`;
    musicPlayer.style.top = `${e.clientY - offsetY}px`;
});

document.addEventListener('mouseup', () => {
    isDragging = false;
    musicPlayer.style.cursor = 'default';
});

// Load the first song
loadSong(playlist[songIndex]);
