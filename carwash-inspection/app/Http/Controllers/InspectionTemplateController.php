<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreInspectionTemplateRequest;
use App\Http\Requests\UpdateInspectionTemplateRequest;
use App\Models\InspectionTemplate;
use App\Traits\LogsConfigAudit;
use Inertia\Inertia;

class InspectionTemplateController extends Controller
{
    use LogsConfigAudit;

    public function index()
    {
        $templates = InspectionTemplate::orderBy('category')->orderBy('name')->paginate(20);

        return Inertia::render('InspectionTemplates/Index', [
            'templates' => $templates,
        ]);
    }

    public function store(StoreInspectionTemplateRequest $request)
    {
        $template = InspectionTemplate::create($request->validated());

        $this->logConfigCreate('inspection_template', $template->id, $template->toArray());

        return redirect()->route('inspection-templates.index')->with('success', 'Inspection template created.');
    }

    public function update(UpdateInspectionTemplateRequest $request, InspectionTemplate $inspectionTemplate)
    {
        $oldValues = $inspectionTemplate->toArray();

        $data = $request->validated();
        $data['version'] = $inspectionTemplate->version + 1;

        $inspectionTemplate->update($data);

        $this->logConfigUpdate('inspection_template', $inspectionTemplate->id, $oldValues, $inspectionTemplate->fresh()->toArray());

        return redirect()->route('inspection-templates.index')->with('success', 'Inspection template updated.');
    }

    public function destroy(InspectionTemplate $inspectionTemplate)
    {
        $oldValues = $inspectionTemplate->toArray();

        $inspectionTemplate->delete();

        $this->logConfigDelete('inspection_template', $inspectionTemplate->id, $oldValues);

        return redirect()->route('inspection-templates.index')->with('success', 'Inspection template deleted.');
    }
}
