<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreServiceItemRequest;
use App\Http\Requests\UpdateServiceItemRequest;
use App\Models\ServiceItem;
use App\Traits\LogsConfigAudit;
use Inertia\Inertia;

class ServiceItemController extends Controller
{
    use LogsConfigAudit;

    public function index()
    {
        $items = ServiceItem::orderBy('category')->orderBy('name')->paginate(20);

        return Inertia::render('ServiceItems/Index', [
            'items' => $items,
        ]);
    }

    public function store(StoreServiceItemRequest $request)
    {
        $item = ServiceItem::create($request->validated());

        $this->logConfigCreate('service_item', $item->id, $item->toArray());

        return redirect()->route('service-items.index')->with('success', 'Service item created.');
    }

    public function update(UpdateServiceItemRequest $request, ServiceItem $serviceItem)
    {
        $oldValues = $serviceItem->toArray();

        $serviceItem->update($request->validated());

        $this->logConfigUpdate('service_item', $serviceItem->id, $oldValues, $serviceItem->fresh()->toArray());

        return redirect()->route('service-items.index')->with('success', 'Service item updated.');
    }

    public function destroy(ServiceItem $serviceItem)
    {
        $oldValues = $serviceItem->toArray();

        $serviceItem->delete();

        $this->logConfigDelete('service_item', $serviceItem->id, $oldValues);

        return redirect()->route('service-items.index')->with('success', 'Service item deleted.');
    }
}
