// main.js - Modern ES Module Version

// 1. IMPORT THE LATEST LIBRARIES
// The browser will automatically fetch these from the CDN.
import { Flow } from 'https://unpkg.com/vexflow/build/esm/vexflow.js';
import * as Tone from 'https://unpkg.com/tone';

// DOMContentLoaded is still a good practice, but often not needed with modules.
// We'll keep it for robustness to ensure the #notation-container exists.
document.addEventListener('DOMContentLoaded', () => {

    // --- DEFINE YOUR RHYTHM DATA ---
    const rhythmExercise = [
        { pitch: 'c/4', duration: 'q' },
        { pitch: 'c/4', duration: '8' },
        { pitch: 'c/4', duration: '8' },
        { pitch: 'b/4', duration: 'hr' }
    ];

    // --- SETUP VEXFLOW (VISUALS) ---
    // Note: We now use "Flow" directly, as imported.
    const notationContainer = document.getElementById('notation-container');
    notationContainer.innerHTML = '';
    const renderer = new Flow.Renderer(notationContainer, Flow.Renderer.Backends.SVG);
    renderer.resize(500, 150);
    const context = renderer.getContext();
    const stave = new Flow.Stave(10, 40, 480);
    stave.addClef('percussion').addTimeSignature('4/4').setContext(context).draw();
    const vexNotes = rhythmExercise.map(note => new Flow.StaveNote({ keys: [note.pitch], duration: note.duration }));
    const beams = Flow.Beam.generateBeams(vexNotes);
    const voice = new Flow.Voice({ num_beats: 4, beat_value: 4 }).addTickables(vexNotes);
    new Flow.Formatter().joinVoices([voice]).format([voice], 400);
    voice.draw(context, stave);
    beams.forEach(beam => beam.setContext(context).draw());

    // --- SETUP TONE.JS (AUDIO & SCHEDULING) ---
    // Note: The Tone.js code remains almost identical because we imported it as "Tone".
    const synth = new Tone.Synth().toDestination();

    let currentTime = 0;
    const toneEvents = rhythmExercise.map(note => {
        const event = [currentTime, note];
        const durationInSeconds = Tone.Time(note.duration.replace('r', '') + 'n').toSeconds();
        currentTime += durationInSeconds;
        return event;
    });

    const part = new Tone.Part((time, note) => {
        if (!note.duration.includes('r')) {
            const noteDuration = note.duration.replace('r', '') + 'n';
            synth.triggerAttackRelease('C4', noteDuration, time);
        }
    }, toneEvents);
    part.loop = false;

    // --- ADD CONTROLS ---
    document.getElementById('play-button').addEventListener('click', async () => {
        await Tone.start();

        if (Tone.Transport.state === 'started') {
            Tone.Transport.stop();
        } else {
            Tone.Transport.position = 0;
            part.start(0);
            Tone.Transport.start();
        }
    });
});