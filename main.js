// main.js

// --- 1. DEFINE YOUR RHYTHM DATA ---
// An array of objects is a great way to represent a rhythm.
const rhythmExercise = [
    { pitch: 'c/4', duration: 'q' }, // Quarter note
    { pitch: 'c/4', duration: '8' }, // Eighth note
    { pitch: 'c/4', duration: '8' }, // Eighth note
    { pitch: 'b/4', duration: 'qr' }, // Quarter rest
];


// --- 2. SETUP VEXFLOW (VISUALS) ---
const { Renderer, Stave, StaveNote, Formatter, Voice, Beam } = Vex.Flow;
const notationContainer = document.getElementById('notation-container');
const renderer = new Renderer(notationContainer, Renderer.Backends.SVG);
renderer.resize(500, 150);
const context = renderer.getContext();
const stave = new Stave(10, 40, 480);
stave.addClef('percussion').addTimeSignature('4/4');
stave.setContext(context).draw();

// Convert your rhythm data into VexFlow notes
const vexNotes = rhythmExercise.map(note => {
    const isRest = note.duration.includes('r');
    return new StaveNote({
        keys: [note.pitch],
        duration: note.duration,
        // Make rests invisible if they are not the main part of the note
        // For rhythm on a single line, we always need a key. 'b/4' is standard.
        keys: isRest ? ["b/4"] : [note.pitch],
    });
});

// Auto-beam eighth notes
const beams = Beam.generateBeams(vexNotes);

// Create a voice and format it
const voice = new Voice({ num_beats: 4, beat_value: 4 });
voice.addTickables(vexNotes);
new Formatter().joinVoices([voice]).format([voice], 400);

// Render voice
voice.draw(context, stave);
beams.forEach(beam => beam.setContext(context).draw());


// --- 3. SETUP TONE.JS (AUDIO) ---
const synth = new Tone.MembraneSynth().toDestination(); // A nice percussive sound

// We need to keep track of time
let time = 0;

// Use Tone.Part to schedule all the notes
const part = new Tone.Part((time, note) => {
    // the note object is the data from our rhythmExercise array
    if (!note.duration.includes('r')) { // Don't play rests
        synth.triggerAttackRelease("C2", "8n", time);
    }

    // Here you could add logic to highlight the note being played!

}, rhythmExercise.map(note => {
    const noteEvent = {
        time: time,
        note: note, // Pass the whole note object to the callback
    };
    // Advance the time for the next note
    // Tone.js uses notation like '4n' for quarter note duration
    const duration = note.duration.includes('r') ? note.duration.slice(0, -1) + 'n' : note.duration + 'n';
    time += Tone.Time(duration).toSeconds();
    return noteEvent;
}));

part.loop = false;


// --- 4. ADD CONTROLS ---
document.getElementById('play-button').addEventListener('click', async () => {
    await Tone.start(); // Required to start audio in browser
    Tone.Transport.start();
    part.start(0);
});

// The 'New Rhythm' button would regenerate the 'rhythmExercise' array
// and then re-run the VexFlow and Tone.js setup code.
