// main.js

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
    notationContainer.innerHTML = ''; // Clear previous notation

    const renderer = new VF.Renderer(notationContainer, VF.Renderer.Backends.SVG);
    renderer.resize(500, 150);
    const context = renderer.getContext();
    const stave = new VF.Stave(10, 40, 480);
    stave.addClef('percussion').addTimeSignature('4/4').setContext(context).draw();

    const vexNotes = rhythmExercise.map(note => new VF.StaveNote({
        keys: [note.pitch],
        duration: note.duration
    }));

    const beams = VF.Beam.generateBeams(vexNotes);
    const voice = new VF.Voice({ num_beats: 4, beat_value: 4 }).addTickables(vexNotes);
    new VF.Formatter().joinVoices([voice]).format([voice], 400);

    voice.draw(context, stave);
    beams.forEach(beam => beam.setContext(context).draw());


    // --- 3. SETUP TONE.JS (AUDIO) ---
    const synth = new Tone.MembraneSynth().toDestination();

    // Create a part to schedule the audio
    const part = new Tone.Part((time, value) => {
        // THE FIX IS HERE: We access value.note.duration
        // `value` is the full object we passed in: { pitch: '...', duration: '...' }
        if (!value.duration.includes('r')) { // Don't play rests
            synth.triggerAttackRelease("C2", "8n", time);
        }
    }, rhythmExercise); // We can pass the rhythm array directly!

    part.loop = false;


    // --- 4. ADD CONTROLS ---
    document.getElementById('play-button').addEventListener('click', async () => {
        // Make sure the audio context is running before starting the transport
        if (Tone.context.state !== 'running') {
            await Tone.start();
        }
        
        // Ensure transport starts from the beginning and part is scheduled
        Tone.Transport.stop();
        Tone.Transport.position = 0;
        part.start(0);
        Tone.Transport.start();
    });

});