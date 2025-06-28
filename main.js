// main.js

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. DEFINE YOUR RHYTHM DATA (Now adds up to 4 beats) ---
    const rhythmExercise = [
        { pitch: 'c/4', duration: 'q' },  // Quarter note (1 beat)
        { pitch: 'c/4', duration: '8' },  // Eighth note (0.5 beats)
        { pitch: 'c/4', duration: '8' },  // Eighth note (0.5 beats)
        { pitch: 'b/4', duration: 'hr' }  // Half rest (2 beats)
    ];


    // --- 2. SETUP VEXFLOW (VISUALS) ---
    // Use the global Vex object provided by the old library version
    const VF = Vex.Flow;

    const notationContainer = document.getElementById('notation-container');
    // Clear any previous notation before drawing
    notationContainer.innerHTML = '';

    const renderer = new VF.Renderer(notationContainer, VF.Renderer.Backends.SVG);
    renderer.resize(500, 150);
    const context = renderer.getContext();
    const stave = new VF.Stave(10, 40, 480);
    stave.addClef('percussion').addTimeSignature('4/4');
    stave.setContext(context).draw();

    const vexNotes = rhythmExercise.map(note => {
        // Correctly create a StaveNote, adding the 'r' for rests in the duration property
        return new VF.StaveNote({
            keys: [note.pitch], // Use a placeholder key like 'b/4' for rests
            duration: note.duration
        });
    });

    // Auto-beam eighth notes if they are next to each other
    const beams = VF.Beam.generateBeams(vexNotes);

    const voice = new VF.Voice({ num_beats: 4, beat_value: 4 });
    voice.addTickables(vexNotes);
    new VF.Formatter().joinVoices([voice]).format([voice], 400);

    voice.draw(context, stave);
    beams.forEach(beam => beam.setContext(context).draw());


    // --- 3. SETUP TONE.JS (AUDIO) ---
    const synth = new Tone.MembraneSynth().toDestination();

    let time = 0;
    const part = new Tone.Part((time, note) => {
        if (!note.duration.includes('r')) { // Don't play rests
            synth.triggerAttackRelease("C2", "8n", time);
        }
    }, rhythmExercise.map(note => {
        const noteEvent = { time: time, note: note };
        // The duration for Tone.js needs an 'n' at the end (e.g., '4n', '8n')
        const toneDuration = note.duration.replace('r', '') + 'n';
        time += Tone.Time(toneDuration).toSeconds();
        return noteEvent;
    }));

    part.loop = false;


    // --- 4. ADD CONTROLS ---
    document.getElementById('play-button').addEventListener('click', async () => {
        if (Tone.context.state !== 'running') {
            await Tone.start();
        }
        Tone.Transport.start();
        part.start(0);
    });

});