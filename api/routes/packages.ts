import { Router, type Request, type Response } from 'express';
import { authMiddleware, roleCheck } from '../middleware/auth.js';
import * as packageService from '../services/packageService.js';

const router = Router();

router.get('/', authMiddleware, (req: Request, res: Response): void => {
  const activeOnly = req.query.active === 'true';
  const packageTypes = packageService.listPackageTypes(activeOnly);
  res.json({ success: true, data: packageTypes });
});

router.post('/', authMiddleware, roleCheck('admin'), (req: Request, res: Response): void => {
  try {
    const packageType = packageService.createPackageType(req.body);
    res.status(201).json({ success: true, data: packageType });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

router.put('/:id', authMiddleware, roleCheck('admin'), (req: Request, res: Response): void => {
  const packageType = packageService.updatePackageType(parseInt(req.params.id), req.body);
  if (!packageType) {
    res.status(404).json({ success: false, error: 'Package type not found' });
    return;
  }
  res.json({ success: true, data: packageType });
});

router.delete('/:id', authMiddleware, roleCheck('admin'), (req: Request, res: Response): void => {
  const deleted = packageService.deletePackageType(parseInt(req.params.id));
  if (!deleted) {
    res.status(404).json({ success: false, error: 'Package type not found' });
    return;
  }
  res.json({ success: true, message: 'Package type deleted' });
});

router.post('/members/:id/purchase-package', authMiddleware, roleCheck('admin', 'receptionist'), (req: Request, res: Response): void => {
  try {
    const { package_type_id, paid_amount } = req.body;
    const memberPackage = packageService.purchasePackage(parseInt(req.params.id), package_type_id, paid_amount);
    res.status(201).json({ success: true, data: memberPackage });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'PACKAGE_TYPE_NOT_FOUND') {
      res.status(404).json({ success: false, error: 'Package type not found' });
      return;
    }
    if (msg === 'MEMBER_NOT_FOUND') {
      res.status(404).json({ success: false, error: 'Member not found' });
      return;
    }
    res.status(400).json({ success: false, error: msg });
  }
});

router.get('/members/:id/packages', authMiddleware, (req: Request, res: Response): void => {
  const packages = packageService.listMemberPackages(parseInt(req.params.id));
  res.json({ success: true, data: packages });
});

export default router;
