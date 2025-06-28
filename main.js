// main.js - With DYNAMIC Triplet Support

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. HELPER FUNCTION (Unchanged) ---
    function vexflowToToneDuration(vexflowValue) {
        const map = {
            'w': '1n', 'h': '2n', 'q': '4n', '8': '8n', '16': '16n', '32': '32n'
        };
        const isRest = vexflowValue.includes('r');
        const key = vexflowValue.replace('r', '');
        return { duration: map[key] || '4n', isRest };
    }

    // --- 2. SETUP (Unchanged) ---
    const synth = new Tone.Synth().toDestination();
    let activePart;

    // --- 3. THE MAIN EVENT HANDLER ---
    document.getElementById('play-button').addEventListener('click', async () => {
        await Tone.start();

        // --- TEARDOWN PHASE (Unchanged) ---
        Tone.Transport.stop();
        if (activePart) {
            activePart.dispose();
        }
        Tone.Transport.cancel(0);

        // --- BUILD PHASE ---

        // A. Your new rhythm data.
        const rhythmExercise = [
            { pitch: 'c/4', duration: 'q' },
            { pitch: 'c/4', duration: 'q' },
            { pitch: 'd/4', duration: '8', isTriplet: true },
            { pitch: 'e/4', duration: '8', isTriplet: true },
            { pitch: 'f/4', duration: '8', isTriplet: true },
            { pitch: 'd/4', duration: '8', isTriplet: true },
            { pitch: 'e/4', duration: '8', isTriplet: true },
            { pitch: 'f/4', duration: '8', isTriplet: true },
        ];

        // B. Draw the visuals with VexFlow.
        const { Renderer, Stave, StaveNote, Formatter, Voice, Beam, Tuplet } = Vex.Flow;
        const notationContainer = document.getElementById('notation-container');
        notationContainer.innerHTML = '';
        const renderer = new Renderer(notationContainer, Renderer.Backends.SVG);
        renderer.resize(500, 150);
        const context = renderer.getContext();
        const stave = new Stave(10, 40, 480);
        stave.addClef('percussion').addTimeSignature('4/4').setContext(context).draw();
        
        const vexNotes = rhythmExercise.map(note => new StaveNote({
            keys: [note.pitch || 'b/4'],
            duration: note.duration
        }));

        // **THE ROBUST TRIPLET FIX IS HERE**
        // Find all the notes that are marked as part of a triplet.
        const tripletNotes = vexNotes.filter((note, index) => rhythmExercise[index].isTriplet);
        
        // Only create a tuplet if there are triplet notes to draw.
        let tuplet;
        if (tripletNotes.length > 0) {
            tuplet = new Tuplet(tripletNotes, { num_notes: 3, notes_occupied: 2 });
        }

        const beams = Beam.generateBeams(vexNotes);
        const voice = new Voice({ num_beats: 4, beat_value: 4 }).addTickables(vexNotes);
        new Formatter().joinVoices([voice]).format([voice], 400);
        
        voice.draw(context, stave);
        beams.forEach(beam => beam.setContext(context).draw());
        
        // Draw the tuplet only if it was created.
        if (tuplet) {
            tuplet.setContext(context).draw();
        }

        // C. Schedule the audio (Unchanged, this logic was already correct).
        let time = 0;
        const events = [];
        for (const note of rhythmExercise) {
            let { duration, isRest } = vexflowToToneDuration(note.duration);
            if (note.isTriplet) {
                duration = duration.replace('n', 't');
            }
            if (!isRest && note.pitch) {
                const tonePitch = note.pitch.replace('/', '').toUpperCase();
                events.push({ time: time, note: tonePitch, duration: duration });
            }
            time += Tone.Time(duration).toSeconds();
        }

        // D. Create the part (Unchanged).
        activePart = new Tone.Part((time, value) => {
            synth.triggerAttackRelease(value.note, value.duration, time);
        }, events);
        
        // --- PLAY PHASE (Unchanged) ---
        Tone.Transport.position = 0;
        activePart.start(0);
        Tone.Transport.start();
    });
});