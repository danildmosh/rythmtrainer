// main.js - CANONICAL AND ROBUST VERSION

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

    // --- 4. ADD CONTROLS ---
    document.getElementById('play-button').addEventListener('click', async () => {
        // Ensure AudioContext is running
        if (Tone.context.state !== 'running') {
            await Tone.start();
        }

        // --- THE DEFINITIVE FIX IS HERE ---
        // We use Tone.Transport.scheduleOnce() for each note.

        // 1. Stop transport and clear all previously scheduled events.
        Tone.Transport.stop();
        Tone.Transport.cancel(0);

        // 2. Iterate through our rhythm and schedule each note individually.
        let currentTime = 0;
        rhythmExercise.forEach(note => {
            // scheduleOnce() is the key. It tells the transport: "At 'currentTime', run this callback".
            Tone.Transport.scheduleOnce((time) => {
                // This callback provides the sample-accurate time for the event.
                if (!note.duration.includes('r')) {
                    // We use 'time' to ensure the synth triggers at the exact right moment.
                    synth.triggerAttackRelease('C2', '8n', time);
                }
            }, currentTime); // The time on the transport to schedule the event.

            // 3. Advance our time cursor for the next note.
            const noteDurationInSeconds = Tone.Time(note.duration.replace('r', '') + 'n').toSeconds();
            currentTime += noteDurationInSeconds;
        });
        
        // 4. Start the transport. It will now play our perfectly scheduled sequence.
        Tone.Transport.start();
    });
});