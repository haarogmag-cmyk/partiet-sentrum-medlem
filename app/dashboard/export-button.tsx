'use client'

export default function ExportButton({ members }: { members: any[] }) {
  
  const handleExport = () => {
    if (!members || members.length === 0) {
      alert('Ingen data å eksportere.')
      return
    }

    // 1. Lag overskrifter (Header row)
    const headers = ['Fornavn', 'Etternavn', 'E-post', 'Telefon', 'Fødselsdato', 'Postnummer', 'Lokallag', 'Status']
    
    // 2. Konverter dataene til CSV-format
    const csvRows = [
      headers.join(';'), // Excel i Norge liker semikolon (;) bedre enn komma
      ...members.map(row => [
        row.first_name,
        row.last_name,
        row.email,
        row.phone,
        row.birth_date,
        row.postal_code,
        // Henter ut lokallagsnavnet trygt
        (row.lokallag_navn || '').replace('Partiet Sentrum ', ''),
        row.payment_status === 'active' ? 'Betalt' : 'Ikke betalt'
      ].join(';'))
    ]

    const csvString = csvRows.join('\n')

    // 3. Legg til "BOM" (Byte Order Mark) så Excel forstår ÆØÅ
    const bom = '\uFEFF'
    const blob = new Blob([bom + csvString], { type: 'text/csv;charset=utf-8;' })
    
    // 4. Start nedlasting
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `medlemsliste_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <button 
      onClick={handleExport}
      className="px-4 py-2 bg-white border border-[#c93960]/30 rounded-lg text-sm font-bold hover:bg-[#fffcf1] transition-colors flex items-center gap-2"
      style={{ color: '#c93960' }}
    >
      <span>📥</span> Last ned liste
    </button>
  )
}