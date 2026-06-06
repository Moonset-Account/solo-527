<?php

namespace App\Http\Controllers;

use App\Models\Clay;
use App\Models\Glaze;
use App\Models\GlazeCompatibility;
use Illuminate\Http\Request;

class MaterialController extends Controller
{
    public function claysIndex()
    {
        $clays = Clay::where('is_active', true)->get();

        return response()->json($clays);
    }

    public function claysStore(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|unique:clays',
            'description' => 'nullable|string',
            'firing_temp_min' => 'required|integer|min:0',
            'firing_temp_max' => 'required|integer|min:0',
            'atmosphere' => 'required|in:oxidation,reduction,neutral',
            'shrinkage_rate' => 'nullable|numeric|min:0|max:100',
        ]);

        $clay = Clay::create($request->all());

        return response()->json($clay, 201);
    }

    public function claysUpdate(Request $request, Clay $clay)
    {
        $request->validate([
            'name' => 'string|max:255',
            'code' => 'string|unique:clays,code,' . $clay->id,
            'description' => 'nullable|string',
            'firing_temp_min' => 'integer|min:0',
            'firing_temp_max' => 'integer|min:0',
            'atmosphere' => 'in:oxidation,reduction,neutral',
            'shrinkage_rate' => 'nullable|numeric|min:0|max:100',
            'is_active' => 'boolean',
        ]);

        $clay->update($request->all());

        return response()->json($clay->fresh());
    }

    public function glazesIndex()
    {
        $glazes = Glaze::where('is_active', true)->get();

        return response()->json($glazes);
    }

    public function glazesStore(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|unique:glazes',
            'color' => 'required|string',
            'description' => 'nullable|string',
            'firing_temp_min' => 'required|integer|min:0',
            'firing_temp_max' => 'required|integer|min:0',
            'atmosphere' => 'required|in:oxidation,reduction,neutral',
            'finish' => 'in:glossy,matte,satin,textured',
        ]);

        $glaze = Glaze::create($request->all());

        return response()->json($glaze, 201);
    }

    public function glazesUpdate(Request $request, Glaze $glaze)
    {
        $request->validate([
            'name' => 'string|max:255',
            'code' => 'string|unique:glazes,code,' . $glaze->id,
            'color' => 'string',
            'description' => 'nullable|string',
            'firing_temp_min' => 'integer|min:0',
            'firing_temp_max' => 'integer|min:0',
            'atmosphere' => 'in:oxidation,reduction,neutral',
            'finish' => 'in:glossy,matte,satin,textured',
            'is_active' => 'boolean',
        ]);

        $glaze->update($request->all());

        return response()->json($glaze->fresh());
    }

    public function getGlazeCompatibilities(Glaze $glaze)
    {
        $compatibilities = GlazeCompatibility::where('glaze1_id', $glaze->id)
            ->orWhere('glaze2_id', $glaze->id)
            ->with('glaze1', 'glaze2')
            ->get();

        return response()->json($compatibilities);
    }

    public function setGlazeCompatibility(Request $request)
    {
        $request->validate([
            'glaze1_id' => 'required|exists:glazes,id',
            'glaze2_id' => 'required|exists:glazes,id|different:glaze1_id',
            'compatibility' => 'required|in:compatible,incompatible,caution',
            'notes' => 'nullable|string',
        ]);

        $compatibility = GlazeCompatibility::updateOrCreate(
            [
                'glaze1_id' => min($request->glaze1_id, $request->glaze2_id),
                'glaze2_id' => max($request->glaze1_id, $request->glaze2_id),
            ],
            [
                'compatibility' => $request->compatibility,
                'notes' => $request->notes,
            ]
        );

        return response()->json($compatibility);
    }
}
