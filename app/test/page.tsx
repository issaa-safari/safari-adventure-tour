import { createClient } from '@/lib/supabase/server'

export default async function TestPage() {
  const supabase = await createClient()

  const { data: tours, error } = await supabase
    .from('tours')
    .select('*')

  if (error) {
    return (
      <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
        <h1 style={{ color: 'red' }}>Connection Error</h1>
        <pre>{JSON.stringify(error, null, 2)}</pre>
      </div>
    )
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#7A9A4A' }}>
        Supabase Connection Test — Safari Adventure Tour
      </h1>
      <p>Found {tours?.length} tours in the database:</p>

      {tours?.map((tour) => (
        <div
          key={tour.id}
          style={{
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '20px',
            marginTop: '20px',
          }}
        >
          <h2>{tour.title_en}</h2>
          <p>{tour.subtitle_en}</p>
          <p>
            <strong>Type:</strong> {tour.type} &nbsp;|&nbsp;
            <strong>Duration:</strong> {tour.duration_days} days /{' '}
            {tour.duration_nights} nights &nbsp;|&nbsp;
            <strong>Status:</strong> {tour.status}
          </p>
        </div>
      ))}
    </div>
  )
}
