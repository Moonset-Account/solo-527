import { DataSource } from 'typeorm';
import dataSource from './typeorm.config';
import { Customer, Subscription, Bill, CollectionRhythm } from '@/database/entities';
import { addMonths, startOfMonth, format } from 'date-fns';

async function seed() {
  await dataSource.initialize();

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const customers = [
      { name: 'Tech Corp Ltd', email: 'finance@techcorp.com', phone: '+86-10-12345678', company: 'Tech Corp Ltd', status: 'active' as const },
      { name: 'Global Solutions', email: 'ap@globalsolutions.com', phone: '+86-21-87654321', company: 'Global Solutions', status: 'active' as const },
      { name: 'Innovation Labs', email: 'billing@innovationlabs.com', phone: '+86-755-11112222', company: 'Innovation Labs', status: 'active' as const },
      { name: 'Digital Ventures', email: 'accounts@digitalventures.com', phone: '+86-10-33334444', company: 'Digital Ventures', status: 'active' as const },
      { name: 'Cloud Services Inc', email: 'finance@cloudservices.com', phone: '+86-20-55556666', company: 'Cloud Services Inc', status: 'active' as const },
    ];

    const savedCustomers: Customer[] = [];
    for (const customer of customers) {
      savedCustomers.push(await queryRunner.manager.save(Customer, customer));
    }

    const subscriptions: Partial<Subscription>[] = [];
    savedCustomers.forEach((customer, idx) => {
      subscriptions.push({
        customerId: customer.id,
        planName: ['Enterprise', 'Professional', 'Starter', 'Enterprise', 'Professional'][idx],
        amount: [9999, 4999, 1999, 12999, 5999][idx],
        currency: 'CNY',
        billingCycle: 'monthly',
        startDate: startOfMonth(addMonths(new Date(), -6)),
        status: 'active',
        features: ['API Access', 'Priority Support', 'Custom Reports', 'SLA Guarantee'],
      });
    });

    const savedSubscriptions: Subscription[] = [];
    for (const sub of subscriptions) {
      savedSubscriptions.push(await queryRunner.manager.save(Subscription, sub));
    }

    const billNumberCounter = { value: 1000 };
    const generateBillNumber = () => {
      billNumberCounter.value++;
      return `BILL-${new Date().getFullYear()}-${billNumberCounter.value.toString().padStart(6, '0')}`;
    };

    for (let i = 0; i < 30; i++) {
      const customerIdx = i % savedCustomers.length;
      const subscriptionIdx = i % savedSubscriptions.length;
      const monthsAgo = Math.floor(i / 5);
      const issueDate = startOfMonth(addMonths(new Date(), -monthsAgo));
      const dueDate = addMonths(issueDate, 1);

      let status: any = 'issued';
      const overdueDays = Math.max(0, Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));

      if (overdueDays > 0) {
        status = overdueDays > 60 ? 'overdue' : (i % 3 === 0 ? 'partial' : 'overdue');
      } else if (i % 4 === 0) {
        status = 'paid';
      } else if (i % 5 === 0) {
        status = 'pending';
      }

      const totalAmount = savedSubscriptions[subscriptionIdx].amount;
      const paidAmount = status === 'paid' ? totalAmount : (status === 'partial' ? totalAmount * 0.5 : 0);

      const bill: Partial<Bill> = {
        customerId: savedCustomers[customerIdx].id,
        subscriptionId: savedSubscriptions[subscriptionIdx].id,
        billNumber: generateBillNumber(),
        totalAmount,
        paidAmount,
        remainingAmount: totalAmount - paidAmount,
        currency: 'CNY',
        issueDate,
        dueDate,
        status,
        overdueDays: status === 'paid' ? 0 : overdueDays,
        interestRate: 0.05,
        description: `${savedSubscriptions[subscriptionIdx].planName} subscription for ${format(issueDate, 'MMM yyyy')}`,
        items: [
          {
            name: savedSubscriptions[subscriptionIdx].planName + ' Subscription',
            description: 'Monthly subscription fee',
            quantity: 1,
            unitPrice: totalAmount,
            amount: totalAmount,
          },
        ],
        paymentTerms: {
          method: 'Bank Transfer',
          bankName: 'Bank of China',
          accountNumber: '1234 5678 9012 3456',
          accountHolder: 'Our Company Ltd',
        },
      };

      await queryRunner.manager.save(Bill, bill);
    }

    const rhythms: Partial<CollectionRhythm>[] = [
      {
        name: 'Gentle Reminder',
        description: 'First reminder when bill becomes overdue',
        daysOverdue: 1,
        severity: 'reminder',
        channel: 'email',
        template: 'Dear {{customerName}},\n\nThis is a gentle reminder that your bill {{billNumber}} for amount {{amount}} is now {{overdueDays}} days past due. Please arrange payment at your earliest convenience.\n\nBest regards,\nFinance Team',
        subject: 'Payment Reminder: Bill {{billNumber}}',
        isActive: true,
        priority: 1,
      },
      {
        name: 'Formal Warning',
        description: 'Second reminder after 7 days overdue',
        daysOverdue: 7,
        severity: 'warning',
        channel: 'email',
        template: 'Dear {{customerName}},\n\nWe note that your bill {{billNumber}} for amount {{amount}} is now {{overdueDays}} days past due. Please settle this amount within 3 days to avoid further action.\n\nRegards,\nFinance Team',
        subject: 'URGENT: Payment Overdue - Bill {{billNumber}}',
        isActive: true,
        priority: 2,
      },
      {
        name: 'Phone Call Follow-up',
        description: 'Phone call after 15 days overdue',
        daysOverdue: 15,
        severity: 'urgent',
        channel: 'phone',
        template: 'Call script: Discuss bill {{billNumber}} overdue by {{overdueDays}} days, amount {{amount}}. Understand reasons for delay, negotiate payment plan if needed.',
        subject: '',
        isActive: true,
        priority: 3,
      },
      {
        name: 'Legal Notice',
        description: 'Final notice before legal action after 30 days',
        daysOverdue: 30,
        severity: 'legal',
        channel: 'letter',
        template: 'FORMAL DEMAND FOR PAYMENT\n\nDear {{customerName}},\n\nDespite our previous reminders, your bill {{billNumber}} for amount {{amount}} remains unpaid for {{overdueDays}} days. Unless full payment is received within 7 days, we will be forced to initiate legal proceedings.\n\nYours faithfully,\nLegal Department',
        subject: 'FINAL NOTICE: Immediate Payment Required',
        isActive: true,
        priority: 4,
      },
    ];

    for (const rhythm of rhythms) {
      await queryRunner.manager.save(CollectionRhythm, rhythm);
    }

    await queryRunner.commitTransaction();
    console.log('Seed data inserted successfully');
    process.exit(0);
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await queryRunner.release();
  }
}

seed();
