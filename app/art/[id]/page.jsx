import axios from "axios";
import Link from "next/link";

async function hentVaerk(id) {
  const { data } = await axios.get(
    `https://api.smk.dk/api/v1/art?object_number=${id}`
  );
  return data.items?.[0] || null;
}

async function hentLignendeVaerker(similarUrl, originalId) {
  try {
    const { data } = await axios.get(similarUrl);
    const objectNumbers = data.object_numbers || [];

    if (!Array.isArray(objectNumbers) || objectNumbers.length === 0) return [];

    const query = objectNumbers.map((id) => `object_number=${id}`).join("&");
    const { data: result } = await axios.get(
      `https://api.smk.dk/api/v1/art?${query}`
    );

    return (
      result.items
        ?.filter((item) => item.object_number !== originalId)
        .slice(0, 4) || []
    );
  } catch (err) {
    console.error("Fejl ved hentning af lignende værker:", err);
    return [];
  }
}

export default async function VaerkDetalje({ params }) {
  const vaerk = await hentVaerk(params.id);

  if (!vaerk) {
    return <div className="p-4">Værket blev ikke fundet.</div>;
  }

  const lignende = vaerk.similar_images_url
    ? await hentLignendeVaerker(vaerk.similar_images_url, vaerk.object_number)
    : [];

  const billedeUrl =
    vaerk.image_thumbnail ||
    (vaerk.image_iiif_id
      ? `${vaerk.image_iiif_id}/full/!400,/0/default.jpg`
      : null);

  return (
    <div className="p-4 max-w-3xl mx-auto">
      {/* Tilbage-knap */}
      <Link
        href="/events"
        className="border-none mt-2 text-[var(--color-lightgreen)] hover:text-[var(--color-darkgreen)] "
      >
        ← Tilbage
      </Link>

      {/* Titel og metadata */}
      <h1 className="text-3xl font-bold mt-4">
        {vaerk.titles?.[0]?.title || "Ukendt titel"}
      </h1>
      <p className="text-lg">
        Kunstner: {vaerk.artist?.join(", ") || "Ukendt"}
      </p>
      <p className="text-sm text-gray-600">
        Periode: {vaerk.production_date?.[0]?.period || "Ukendt"}
      </p>

      {/* Billede */}
      {billedeUrl ? (
        <img
          src={billedeUrl}
          alt={vaerk.titles?.[0]?.title || "Ukendt titel"}
          className="my-4 rounded shadow-lg"
        />
      ) : (
        <p className="italic text-gray-500">Ingen billede tilgængelig</p>
      )}

      {/* Materiale og teknik */}
      <p>
        <strong>Materiale:</strong> {vaerk.materiale || "Ukendt"}
      </p>
      <p>
        <strong>Teknik:</strong> {vaerk.techniques?.[0] || "Ukendt"}
      </p>

      {/* Beskrivelse */}
      {vaerk.description && <p className="mt-4">{vaerk.description}</p>}

      {/* Lignende værker */}
      {lignende.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">Lignende værker</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {lignende.map((item) => {
              const title = item.titles?.[0]?.title || "Ukendt titel";
              const thumb =
                item.image_thumbnail ||
                (item.image_iiif_id
                  ? `${item.image_iiif_id}/full/!400,/0/default.jpg`
                  : null);

              return (
                <Link
                  href={`/art/${item.object_number}`}
                  key={item.object_number}
                >
                  <div className="aspect-[4/3] w-full overflow-hidden rounded shadow">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={title}
                        className="w-full h-full object-cover hover:opacity-80 transition"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-xs text-gray-500 text-center px-2">
                          Intet billede
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-sm mt-1">{title}</p>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
