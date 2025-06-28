// main.js - Using Tone.Part, the correct scheduler for this task.

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

    // --- 3. SETUP TONE.JS (AUDIO & SCHEDULING) ---

    // Using a more melodic synth to make notes distinct
    const synth = new Tone.Synth().toDestination();

    // Convert our rhythm data into an array of [time, value] pairs for Tone.Part
    let currentTime = 0;
    const toneEvents = rhythmExercise.map(note => {
        const event = [currentTime, note];
        const durationInSeconds = Tone.Time(note.duration.replace('r', '') + 'n').toSeconds();
        currentTime += durationInSeconds;
        return event;
    });

    // Create the Tone.Part. This is the scheduler.
    const part = new Tone.Part((time, note) => {
        // This callback is executed by the transport at the correct time.
        if (!note.duration.includes('r')) {
            const noteDuration = note.duration.replace('r', '') + 'n';
            // Use the 'time' argument for sample-accurate playback.
            synth.triggerAttackRelease('C4', noteDuration, time);
        }
    }, toneEvents);
    part.loop = false;

    // --- 4. ADD CONTROLS ---
    document.getElementById('play-button').addEventListener('click', async () => {
        // Ensure the audio context is running
        await Tone.start();

        // If the transport is already playing, stop it and rewind.
        if (Tone.Transport.state === 'started') {
            Tone.Transport.stop();
        } else {
            // Otherwise, rewind to the beginning and start the transport.
            // The Part will play automatically because it's synced to the transport.
            Tone.Transport.position = 0;
            part.start(0);
            Tone.Transport.start();
        }
    });
});