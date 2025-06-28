// main.js - Aligned with Official Tone.js Examples

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. DEFINE YOUR RHYTHM DATA ---
    const rhythmExercise = [
        { pitch: 'c/4', duration: 'q' },   // Quarter note
        { pitch: 'c/4', duration: '8' },   // Eighth note
        { pitch: 'c/4', duration: '8' },   // Eighth note
        { pitch: 'b/4', duration: 'hr' }  // Half rest
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
        // We still need to start the AudioContext on a user gesture.
        if (Tone.context.state !== 'running') {
            await Tone.start();
        }

        // --- NEW, SIMPLER, CORRECTED LOGIC ---

        // 1. Get the current time from the AudioContext.
        const now = Tone.now();
        let currentTime = 0;

        // 2. Loop through the notes and schedule them relative to 'now'.
        rhythmExercise.forEach(note => {
            if (!note.duration.includes('r')) {
                // Schedule the note to play at 'now + currentTime'.
                // The third argument of triggerAttackRelease is the absolute time to play.
                synth.triggerAttackRelease('C2', '8n', now + currentTime);
            }

            // 3. Advance our time cursor for the next note.
            const noteDurationInSeconds = Tone.Time(note.duration.replace('r', '') + 'n').toSeconds();
            currentTime += noteDurationInSeconds;
        });
    });
});