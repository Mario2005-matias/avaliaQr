<?php

namespace App\Http\Requests\Public;

use Illuminate\Foundation\Http\FormRequest;

class StoreRatingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Rota pública, sem autenticação
    }

    public function rules(): array
    {
        return [
            'stars' => ['required', 'integer', 'between:1,5'],
            'comment' => ['nullable', 'string', 'max:1000'],
            'device_id' => ['required', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'stars.required' => 'ESTRELAS_OBRIGATORIAS',
            'stars.between' => 'ESTRELAS_INVALIDAS',
            'comment.max' => 'COMENTARIO_LONGO',
            'device_id.required' => 'DEVICE_ID_OBRIGATORIO',
        ];
    }
}
