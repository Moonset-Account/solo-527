import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import random
from app.core.database import SessionLocal, engine, Base
from app.models import Book, RecycleRecord, PricingHistory, SaleRecord
from app.models.book import BookCondition, Channel

Base.metadata.create_all(bind=engine)

BOOK_DATA = [
    {
        "isbn": "9787020002207",
        "title": "红楼梦",
        "author": "曹雪芹",
        "publisher": "人民文学出版社",
        "publish_date": "2008-07",
        "is_set": True,
        "set_count": 4,
        "category": "文学",
        "suggested_price_new": 80,
        "suggested_price_like_new": 60,
        "suggested_price_good": 45,
        "suggested_price_fair": 30,
        "suggested_price_poor": 15,
    },
    {
        "isbn": "9787544270878",
        "title": "活着",
        "author": "余华",
        "publisher": "南海出版公司",
        "publish_date": "2012-08",
        "is_set": False,
        "set_count": 1,
        "category": "文学",
        "suggested_price_new": 25,
        "suggested_price_like_new": 18,
        "suggested_price_good": 12,
        "suggested_price_fair": 8,
        "suggested_price_poor": 4,
    },
    {
        "isbn": "9787111213826",
        "title": "深入理解计算机系统",
        "author": "Randal E. Bryant",
        "publisher": "机械工业出版社",
        "publish_date": "2016-11",
        "is_set": False,
        "set_count": 1,
        "category": "计算机",
        "suggested_price_new": 99,
        "suggested_price_like_new": 70,
        "suggested_price_good": 50,
        "suggested_price_fair": 35,
        "suggested_price_poor": 20,
    },
    {
        "isbn": "9787115428028",
        "title": "算法导论",
        "author": "Thomas H. Cormen",
        "publisher": "人民邮电出版社",
        "publish_date": "2013-01",
        "is_set": False,
        "set_count": 1,
        "category": "计算机",
        "suggested_price_new": 128,
        "suggested_price_like_new": 90,
        "suggested_price_good": 65,
        "suggested_price_fair": 45,
        "suggested_price_poor": 25,
    },
    {
        "isbn": "9787544291189",
        "title": "百年孤独",
        "author": "加西亚·马尔克斯",
        "publisher": "南海出版公司",
        "publish_date": "2017-08",
        "is_set": False,
        "set_count": 1,
        "category": "文学",
        "suggested_price_new": 45,
        "suggested_price_like_new": 32,
        "suggested_price_good": 22,
        "suggested_price_fair": 15,
        "suggested_price_poor": 8,
    },
    {
        "isbn": "9787532754688",
        "title": "追风筝的人",
        "author": "卡勒德·胡赛尼",
        "publisher": "上海译文出版社",
        "publish_date": "2006-05",
        "is_set": False,
        "set_count": 1,
        "category": "文学",
        "suggested_price_new": 30,
        "suggested_price_like_new": 20,
        "suggested_price_good": 14,
        "suggested_price_fair": 9,
        "suggested_price_poor": 5,
    },
    {
        "isbn": "9787111641247",
        "title": "代码整洁之道",
        "author": "Robert C. Martin",
        "publisher": "机械工业出版社",
        "publish_date": "2010-01",
        "is_set": False,
        "set_count": 1,
        "category": "计算机",
        "suggested_price_new": 59,
        "suggested_price_like_new": 42,
        "suggested_price_good": 30,
        "suggested_price_fair": 20,
        "suggested_price_poor": 10,
    },
    {
        "isbn": "9787506391825",
        "title": "平凡的世界",
        "author": "路遥",
        "publisher": "北京十月文艺出版社",
        "publish_date": "2016-10",
        "is_set": True,
        "set_count": 3,
        "category": "文学",
        "suggested_price_new": 108,
        "suggested_price_like_new": 75,
        "suggested_price_good": 55,
        "suggested_price_fair": 38,
        "suggested_price_poor": 20,
    },
]


def create_books(db: Session):
    books = []
    for book_data in BOOK_DATA:
        book = Book(**book_data)
        db.add(book)
        books.append(book)
    db.commit()
    for book in books:
        db.refresh(book)
    return books


def create_recycle_records(db: Session, books):
    records = []
    record_counter = 1
    
    for book in books:
        for _ in range(random.randint(5, 15)):
            condition = random.choice(BookCondition.ALL)
            channel = random.choice(Channel.ALL)
            
            suggested_price_field = {
                "全新": "suggested_price_new",
                "九成新": "suggested_price_like_new",
                "八成新": "suggested_price_good",
                "七成新": "suggested_price_fair",
                "六成新及以下": "suggested_price_poor",
            }.get(condition, "suggested_price_good")
            
            suggested_price = getattr(book, suggested_price_field) or 20
            
            price_variation = random.uniform(-0.2, 0.3)
            recycle_price = round(suggested_price * (1 + price_variation), 2)
            
            logistics_cost = round(random.uniform(2, 8), 2)
            other_cost = round(random.uniform(0, 3), 2)
            total_cost = round(recycle_price + logistics_cost + other_cost, 2)
            
            days_ago = random.randint(1, 120)
            recycle_date = datetime.now() - timedelta(days=days_ago)
            in_stock_date = recycle_date + timedelta(days=random.randint(0, 3))
            
            is_sold = random.random() > 0.4
            sale_price = None
            sale_date = None
            days_in_stock = days_ago
            
            if is_sold:
                days_to_sell = random.randint(1, min(days_ago, 60))
                days_in_stock = days_to_sell
                sale_date = in_stock_date + timedelta(days=days_to_sell)
                sale_price = round(total_cost * random.uniform(1.3, 2.0), 2)
            
            is_abnormal = abs(price_variation) > 0.3
            abnormal_reason = None
            if is_abnormal:
                if price_variation > 0:
                    abnormal_reason = "回收价偏高，可能影响毛利"
                else:
                    abnormal_reason = "回收价偏低，可能影响收书量"
            
            record = RecycleRecord(
                record_no=f"RC{datetime.now().strftime('%Y%m%d')}{record_counter:04d}",
                book_id=book.id,
                isbn=book.isbn,
                condition=condition,
                recycle_price=recycle_price,
                logistics_cost=logistics_cost,
                other_cost=other_cost,
                total_cost=total_cost,
                channel=channel,
                operator=random.choice(["张三", "李四", "王五", "赵六"]),
                recycle_date=recycle_date,
                in_stock_date=in_stock_date,
                sale_date=sale_date,
                is_sold=is_sold,
                sale_price=sale_price,
                days_in_stock=days_in_stock,
                is_abnormal=is_abnormal,
                abnormal_reason=abnormal_reason,
                pricing_version="V20240101_INIT"
            )
            db.add(record)
            records.append(record)
            record_counter += 1
    
    db.commit()
    for record in records:
        db.refresh(record)
    return records


def create_sale_records(db: Session, recycle_records):
    sale_records = []
    sale_counter = 1
    
    for record in recycle_records:
        if record.is_sold and record.sale_price:
            sale = SaleRecord(
                sale_no=f"S{datetime.now().strftime('%Y%m%d')}{sale_counter:04d}",
                recycle_record_id=record.id,
                book_id=record.book_id,
                isbn=record.isbn,
                condition=record.condition,
                sale_price=record.sale_price,
                sale_date=record.sale_date,
                channel=random.choice(["淘宝", "拼多多", "闲鱼", "门店"]),
                operator=random.choice(["张三", "李四", "王五", "赵六"]),
                pricing_version=record.pricing_version
            )
            db.add(sale)
            sale_records.append(sale)
            sale_counter += 1
    
    db.commit()
    return sale_records


def create_pricing_history(db: Session, books):
    histories = []
    
    conditions_to_update = [
        ("9787544270878", "八成新", 15, "提高回收价以增加收书量", "张三"),
        ("9787111213826", "九成新", 80, "热门教材，提高收价", "李四"),
        ("9787544291189", "全新", 55, "畅销书，调价测试", "王五"),
    ]
    
    for isbn, condition, new_price, reason, operator in conditions_to_update:
        book = next((b for b in books if b.isbn == isbn), None)
        if not book:
            continue
        
        price_field = {
            "全新": "suggested_price_new",
            "九成新": "suggested_price_like_new",
            "八成新": "suggested_price_good",
            "七成新": "suggested_price_fair",
            "六成新及以下": "suggested_price_poor",
        }.get(condition)
        
        old_price = getattr(book, price_field) or 0
        price_change = new_price - old_price
        change_percent = round((price_change / old_price * 100), 2) if old_price > 0 else None
        
        history = PricingHistory(
            book_id=book.id,
            isbn=book.isbn,
            condition=condition,
            old_price=old_price,
            new_price=new_price,
            price_change=price_change,
            change_percent=change_percent,
            operator=operator,
            change_reason=reason,
            effective_date=datetime.now() - timedelta(days=random.randint(5, 30)),
            version=f"V2024{random.randint(100, 999)}"
        )
        db.add(history)
        histories.append(history)
    
    db.commit()
    return histories


def main():
    db = SessionLocal()
    try:
        print("开始初始化数据库...")
        
        print("创建书籍数据...")
        books = create_books(db)
        print(f"创建了 {len(books)} 本书籍")
        
        print("创建回收记录...")
        recycle_records = create_recycle_records(db, books)
        print(f"创建了 {len(recycle_records)} 条回收记录")
        
        print("创建销售记录...")
        sale_records = create_sale_records(db, recycle_records)
        print(f"创建了 {len(sale_records)} 条销售记录")
        
        print("创建定价历史...")
        histories = create_pricing_history(db, books)
        print(f"创建了 {len(histories)} 条定价历史")
        
        print("数据初始化完成！")
    except Exception as e:
        print(f"初始化失败: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
