<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <title>Relatório do técnico - {{ $month }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #222; }
        h1 { color: #163b67; font-size: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 14px; }
        th, td { border: 1px solid #cbd5e1; padding: 7px; text-align: left; }
        th { background: #eaf0f7; }
        .summary { margin: 12px 0; padding: 10px; background: #f1f5f9; }
    </style>
</head>
<body>
    <h1>Relatório do técnico</h1>
    <p><strong>Técnico:</strong> {{ $technician->name }}</p>
    <p><strong>Mês:</strong> {{ $month }}</p>
    <div class="summary">
        <strong>Total de avaliações válidas:</strong> {{ $total_ratings }}
        &nbsp;&nbsp; <strong>Média:</strong> {{ number_format($average_rating, 1, ',', '.') }} / 5
    </div>

    <table>
        <thead>
            <tr><th>Data</th><th>Colégio</th><th>Estrelas</th><th>Comentário</th></tr>
        </thead>
        <tbody>
            @forelse ($ratings as $rating)
                <tr>
                    <td>{{ $rating->created_at->setTimezone('Africa/Luanda')->format('d/m/Y H:i') }}</td>
                    <td>{{ $rating->serviceSession->school->name }}</td>
                    <td>{{ $rating->stars }} / 5</td>
                    <td>{{ $rating->comment ?? '—' }}</td>
                </tr>
            @empty
                <tr><td colspan="4">Sem avaliações válidas neste mês.</td></tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
