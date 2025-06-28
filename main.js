// main.js

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. DEFINE YOUR RHYTHM DATA ---
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

    const vexNotes = rhythmExercise.map(note => {
        const isRest = note.duration.includes('r');
        return new StaveNote({
            keys: [note.pitch],
            duration: note.duration,
            keys: isRest ? ["b/4"] : [note.pitch], 
        });
    });

    const beams = Beam.generateBeams(vexNotes);
    const voice = new Voice({ num_beats: 4, beat_value: 4 });
    voice.addTickables(vexNotes);
    new Formatter().joinVoices([voice]).format([voice], 400);

    voice.draw(context, stave);
    beams.forEach(beam => beam.setContext(context).draw());


    // --- 3. SETUP TONE.JS (AUDIO) ---
    const synth = new Tone.MembraneSynth().toDestination();

    let time = 0;
    const part = new Tone.Part((time, note) => {
        if (!note.duration.includes('r')) {
            synth.triggerAttackRelease("C2", "8n", time);
        }
    }, rhythmExercise.map(note => {
        const noteEvent = {
            time: time,
            note: note,
        };
        const duration = note.duration.includes('r') ? note.duration.slice(0, -1) + 'n' : note.duration + 'n';
        time += Tone.Time(duration).toSeconds();
        return noteEvent;
    }));

    part.loop = false;


    // --- 4. ADD CONTROLS ---
    document.getElementById('play-button').addEventListener('click', async () => {
        await Tone.start();
        Tone.Transport.start();
        part.start(0);
    });
});