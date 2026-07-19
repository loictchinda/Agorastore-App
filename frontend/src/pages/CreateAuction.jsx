import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auctionsService } from '../services/auctions';

export default function CreateAuction() {
    const [form, setForm] = useState({
        title: '', description: '', starting_price: '', end_date: '', image_url: '',
    });
    const [erreur, setErreur] = useState('');
    const [envoi, setEnvoi] = useState(false);
    const navigate = useNavigate();

    const maj = (champ) => (e) => setForm({ ...form, [champ]: e.target.value });

    async function handleSubmit(e) {
        e.preventDefault();
        setErreur('');
        setEnvoi(true);
        try {
            const { auctionId } = await auctionsService.creer({
                ...form,
                starting_price: Number(form.starting_price),
                // datetime-local renvoie "2026-08-01T14:30" — MySQL attend un format
                // qu'il sait parser ; on convertit en ISO pour lever l'ambiguïté.
                end_date: new Date(form.end_date).toISOString().slice(0, 19).replace('T', ' '),
            });
            navigate(`/auctions/${auctionId}`);
        } catch (err) {
            setErreur(err.response?.data?.message || "Création impossible.");
        } finally {
            setEnvoi(false);
        }
    }

    return (
        <div className="form-page large">
            <h1>Créer une enchère</h1>
            <form onSubmit={handleSubmit}>
                <label>Titre
                    <input value={form.title} onChange={maj('title')} required maxLength={100} />
                </label>
                <label>Description
                    <textarea value={form.description} onChange={maj('description')} rows={3} />
                </label>
                <label>Prix de départ (€)
                    <input type="number" step="0.01" min="0.01" required
                        value={form.starting_price} onChange={maj('starting_price')} />
                </label>
                <label>Date de fin
                    <input type="datetime-local" required
                        value={form.end_date} onChange={maj('end_date')} />
                </label>
                <label>URL de l'image (optionnel)
                    <input type="url" value={form.image_url} onChange={maj('image_url')}
                        placeholder="https://…" />
                </label>

                {erreur && <p className="erreur">{erreur}</p>}
                <button type="submit" disabled={envoi}>
                    {envoi ? 'Publication…' : 'Publier l\'enchère'}
                </button>
            </form>
        </div>
    );
}