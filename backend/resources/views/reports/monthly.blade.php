<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <title>Relatório mensal - {{ $month }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #222; }
        h1, h2 { color: #163b67; }
        h1 { font-size: 20px; }
        h2 { margin-top: 24px; font-size: 15px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #cbd5e1; padding: 7px; text-align: left; }
        th { background: #eaf0f7; }
        .summary { margin: 12px 0; padding: 10px; background: #f1f5f9; }
    </style>
</head>
<body>
    <h1>Relatório mensal de avaliações</h1>
    <p>Mês: {{ $month }}</p>
    <div class="summary">
        <strong>Total de avaliações válidas:</strong> {{ $total_ratings }}
        &nbsp;&nbsp; <strong>Média geral:</strong> {{ number_format($average_rating, 1, ',', '.') }} / 5
    </div>

    <h2>Ranking de técnicos</h2>
    <table>
        <thead>
            <tr><th>Posição</th><th>Técnico</th><th>Avaliações</th><th>Média</th></tr>
        </thead>
        <tbody>
            @forelse ($technicians as $index => $technician)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $technician->technician_name }}</td>
                    <td>{{ $technician->ratings_count }}</td>
                    <td>{{ number_format($technician->average_rating, 1, ',', '.') }} / 5</td>
                </tr>
            @empty
                <tr><td colspan="4">Sem avaliações válidas neste mês.</td></tr>
            @endforelse
        </tbody>
    </table>

    <h2>Ranking de colégios</h2>
    <table>
        <thead>
            <tr><th>Posição</th><th>Colégio</th><th>Avaliações</th><th>Média</th></tr>
        </thead>
        <tbody>
            @forelse ($schools as $index => $school)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $school->school_name }}</td>
                    <td>{{ $school->ratings_count }}</td>
                    <td>{{ number_format($school->average_rating, 1, ',', '.') }} / 5</td>
                </tr>
            @empty
                <tr><td colspan="4">Sem avaliações válidas neste mês.</td></tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
