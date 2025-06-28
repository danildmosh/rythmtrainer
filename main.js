// main.js - FINAL WORKING VERSION

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. DEFINE YOUR RHYTHM DATA ---
    const rhythmExercise = [
        { pitch: 'c/4', duration: 'q' },
        { pitch: 'c/4', duration: '8' },
        { pitch: 'c/4', duration: '8' },
        { pitch: 'b/4', duration: 'hr' }
    ];

    // --- 2. SETUP VEXFLOW (VISUALS) ---
    const VF = Vex.Flow;
    const notationContainer = document.getElementById('notation-container');
    notationContainer.innerHTML = '';
    const renderer = new VF.Renderer(notationContainer, VF.Renderer.Backends.SVG);
    renderer.resize(500, 150);
    const context = renderer.getContext();
    const stave = new VF.Stave(10, 40, 480);
    stave.addClef('percussion').addTimeSignature('4/4').setContext(context).draw();
    const vexNotes = rhythmExercise.map(note => new VF.StaveNote({ keys: [note.pitch], duration: note.duration }));
    const beams = VF.Beam.generateBeams(vexNotes);
    const voice = new VF.Voice({ num_beats: 4, beat_value: 4 }).addTickables(vexNotes);
    new VF.Formatter().joinVoices([voice]).format([voice], 400);
    voice.draw(context, stave);
    beams.forEach(beam => beam.setContext(context).draw());

    // --- 3. SETUP TONE.JS (AUDIO) ---
    const synth = new Tone.MembraneSynth().toDestination();

    // *** THE FIX IS HERE ***
    // We now create an array of [time, note] pairs. This is the most reliable format.
    let currentTime = 0;
    const toneEvents = rhythmExercise.map(note => {
        const event = [currentTime, note]; // Create the [time, value] pair
        const toneDuration = note.duration.replace('r', '') + 'n';
        currentTime += Tone.Time(toneDuration).toSeconds();
        return event;
    });

    // The callback now correctly receives the note object as the second argument.
    const part = new Tone.Part((time, note) => {
        if (!note.duration.includes('r')) {
            synth.triggerAttackRelease("C2", "8n", time);
        }
    }, toneEvents);

    part.loop = false;

    // --- 4. ADD CONTROLS ---
    document.getElementById('play-button').addEventListener('click', async () => {
        if (Tone.context.state !== 'running') {
            await Tone.start();
        }
        Tone.Transport.stop();
        Tone.Transport.position = 0;
        part.start(0);
        Tone.Transport.start();
    });
});