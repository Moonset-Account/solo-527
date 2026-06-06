from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    phone = db.Column(db.String(20), unique=True, nullable=False, index=True)
    _password = db.Column('password', db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='user')
    building_id = db.Column(db.Integer, db.ForeignKey('buildings.id'), nullable=True)
    room_number = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    building = db.relationship('Building', backref='users')
    orders = db.relationship('Order', backref='user', lazy=True)
    
    @property
    def password(self):
        return self._password
    
    @password.setter
    def password(self, raw_password):
        self._password = generate_password_hash(raw_password)
    
    def check_password(self, raw_password):
        return check_password_hash(self._password, raw_password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'phone': self.phone,
            'role': self.role,
            'building_id': self.building_id,
            'building_name': self.building.name if self.building else None,
            'room_number': self.room_number,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }

class Building(db.Model):
    __tablename__ = 'buildings'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, index=True)
    address = db.Column(db.String(200))
    contact = db.Column(db.String(50))
    contact_phone = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.now)
    is_active = db.Column(db.Boolean, default=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'address': self.address,
            'contact': self.contact,
            'contact_phone': self.contact_phone,
            'is_active': self.is_active,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }

class Product(db.Model):
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, index=True)
    category = db.Column(db.String(50), index=True)
    unit = db.Column(db.String(20), nullable=False)
    price = db.Column(db.Float, nullable=False)
    stock = db.Column(db.Integer, default=0)
    image = db.Column(db.String(500))
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'unit': self.unit,
            'price': self.price,
            'stock': self.stock,
            'image': self.image,
            'description': self.description,
            'is_active': self.is_active,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }

class Order(db.Model):
    __tablename__ = 'orders'
    
    id = db.Column(db.Integer, primary_key=True)
    order_no = db.Column(db.String(32), unique=True, nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    building_id = db.Column(db.Integer, db.ForeignKey('buildings.id'), nullable=False, index=True)
    room_number = db.Column(db.String(20))
    total_amount = db.Column(db.Float, nullable=False, default=0)
    status = db.Column(db.String(20), nullable=False, default='pending')
    remark = db.Column(db.Text)
    is_cutoff = db.Column(db.Boolean, default=False)
    cutoff_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.now, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    building = db.relationship('Building', backref='orders')
    items = db.relationship('OrderItem', backref='order', lazy=True, cascade='all, delete-orphan')
    shortages = db.relationship('ShortageItem', backref='order', lazy=True)
    refunds = db.relationship('Refund', backref='order', lazy=True)
    sorting_bags = db.relationship('SortingBagItem', backref='order', lazy=True)
    
    def to_dict(self, include_items=False):
        data = {
            'id': self.id,
            'order_no': self.order_no,
            'user_id': self.user_id,
            'user_name': self.user.name if self.user else None,
            'user_phone': self.user.phone if self.user else None,
            'building_id': self.building_id,
            'building_name': self.building.name if self.building else None,
            'room_number': self.room_number,
            'total_amount': self.total_amount,
            'status': self.status,
            'status_text': self.get_status_text(),
            'remark': self.remark,
            'is_cutoff': self.is_cutoff,
            'cutoff_at': self.cutoff_at.strftime('%Y-%m-%d %H:%M:%S') if self.cutoff_at else None,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M:%S')
        }
        if include_items:
            data['items'] = [item.to_dict() for item in self.items]
        return data
    
    def get_status_text(self):
        status_map = {
            'pending': '待确认',
            'confirmed': '已确认',
            'sorting': '分拣中',
            'sorted': '待取货',
            'picked': '已取货',
            'cancelled': '已取消',
            'refunded': '已退款'
        }
        return status_map.get(self.status, self.status)

class OrderItem(db.Model):
    __tablename__ = 'order_items'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    product_name = db.Column(db.String(100), nullable=False)
    unit = db.Column(db.String(20), nullable=False)
    price = db.Column(db.Float, nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    subtotal = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='normal')
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    product = db.relationship('Product')
    
    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'product_id': self.product_id,
            'product_name': self.product_name,
            'unit': self.unit,
            'price': self.price,
            'quantity': self.quantity,
            'subtotal': self.subtotal,
            'status': self.status,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }

class ShortageItem(db.Model):
    __tablename__ = 'shortage_items'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False, index=True)
    order_item_id = db.Column(db.Integer, db.ForeignKey('order_items.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    product_name = db.Column(db.String(100), nullable=False)
    shortage_quantity = db.Column(db.Float, nullable=False)
    replace_product_id = db.Column(db.Integer, db.ForeignKey('products.id'))
    replace_product_name = db.Column(db.String(100))
    replace_quantity = db.Column(db.Float)
    replace_price = db.Column(db.Float)
    status = db.Column(db.String(20), default='pending')
    user_confirm = db.Column(db.Boolean)
    confirm_at = db.Column(db.DateTime)
    remark = db.Column(db.Text)
    handled_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    order_item = db.relationship('OrderItem')
    product = db.relationship('Product', foreign_keys=[product_id])
    replace_product = db.relationship('Product', foreign_keys=[replace_product_id])
    
    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'order_item_id': self.order_item_id,
            'product_id': self.product_id,
            'product_name': self.product_name,
            'shortage_quantity': self.shortage_quantity,
            'replace_product_id': self.replace_product_id,
            'replace_product_name': self.replace_product_name,
            'replace_quantity': self.replace_quantity,
            'replace_price': self.replace_price,
            'status': self.status,
            'status_text': self.get_status_text(),
            'user_confirm': self.user_confirm,
            'confirm_at': self.confirm_at.strftime('%Y-%m-%d %H:%M:%S') if self.confirm_at else None,
            'remark': self.remark,
            'order_no': self.order.order_no if self.order else None,
            'user_name': self.order.user.name if self.order and self.order.user else None,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }
    
    def get_status_text(self):
        status_map = {
            'pending': '待处理',
            'confirmed': '已确认替换',
            'rejected': '用户拒绝',
            'refunded': '已退款',
            'completed': '已完成'
        }
        return status_map.get(self.status, self.status)

class Refund(db.Model):
    __tablename__ = 'refunds'
    
    id = db.Column(db.Integer, primary_key=True)
    refund_no = db.Column(db.String(32), unique=True, nullable=False, index=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False, index=True)
    order_item_id = db.Column(db.Integer, db.ForeignKey('order_items.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    reason = db.Column(db.String(200))
    status = db.Column(db.String(20), default='pending')
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    approved_at = db.Column(db.DateTime)
    remark = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    order_item = db.relationship('OrderItem')
    
    def to_dict(self):
        return {
            'id': self.id,
            'refund_no': self.refund_no,
            'order_id': self.order_id,
            'order_no': self.order.order_no if self.order else None,
            'order_item_id': self.order_item_id,
            'user_id': self.user_id,
            'amount': self.amount,
            'reason': self.reason,
            'status': self.status,
            'status_text': self.get_status_text(),
            'approved_by': self.approved_by,
            'approved_at': self.approved_at.strftime('%Y-%m-%d %H:%M:%S') if self.approved_at else None,
            'remark': self.remark,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }
    
    def get_status_text(self):
        status_map = {
            'pending': '待审核',
            'approved': '已通过',
            'rejected': '已拒绝',
            'completed': '已完成'
        }
        return status_map.get(self.status, self.status)

class SortingBag(db.Model):
    __tablename__ = 'sorting_bags'
    
    id = db.Column(db.Integer, primary_key=True)
    bag_no = db.Column(db.String(50), unique=True, nullable=False, index=True)
    building_id = db.Column(db.Integer, db.ForeignKey('buildings.id'), nullable=False, index=True)
    status = db.Column(db.String(20), default='packing')
    total_orders = db.Column(db.Integer, default=0)
    total_items = db.Column(db.Integer, default=0)
    packed_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    packed_at = db.Column(db.DateTime)
    remark = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    building = db.relationship('Building', backref='sorting_bags')
    items = db.relationship('SortingBagItem', backref='bag', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self, include_items=False):
        data = {
            'id': self.id,
            'bag_no': self.bag_no,
            'building_id': self.building_id,
            'building_name': self.building.name if self.building else None,
            'status': self.status,
            'status_text': self.get_status_text(),
            'total_orders': self.total_orders,
            'total_items': self.total_items,
            'packed_by': self.packed_by,
            'packed_at': self.packed_at.strftime('%Y-%m-%d %H:%M:%S') if self.packed_at else None,
            'remark': self.remark,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }
        if include_items:
            data['items'] = [item.to_dict() for item in self.items]
        return data
    
    def get_status_text(self):
        status_map = {
            'packing': '分拣中',
            'packed': '已打包',
            'delivered': '已配送',
            'completed': '已完成'
        }
        return status_map.get(self.status, self.status)

class SortingBagItem(db.Model):
    __tablename__ = 'sorting_bag_items'
    
    id = db.Column(db.Integer, primary_key=True)
    bag_id = db.Column(db.Integer, db.ForeignKey('sorting_bags.id'), nullable=False, index=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False, index=True)
    order_item_id = db.Column(db.Integer, db.ForeignKey('order_items.id'), nullable=False)
    product_name = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(20), nullable=False)
    is_checked = db.Column(db.Boolean, default=False)
    checked_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    def to_dict(self):
        return {
            'id': self.id,
            'bag_id': self.bag_id,
            'order_id': self.order_id,
            'order_no': self.order.order_no if self.order else None,
            'order_item_id': self.order_item_id,
            'product_name': self.product_name,
            'quantity': self.quantity,
            'unit': self.unit,
            'is_checked': self.is_checked,
            'checked_at': self.checked_at.strftime('%Y-%m-%d %H:%M:%S') if self.checked_at else None,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }

class PickupRecord(db.Model):
    __tablename__ = 'pickup_records'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    picked_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    pickup_code = db.Column(db.String(20), index=True)
    picked_at = db.Column(db.DateTime, default=datetime.now)
    remark = db.Column(db.Text)
    
    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'order_no': self.order.order_no if self.order else None,
            'user_id': self.user_id,
            'picked_by': self.picked_by,
            'pickup_code': self.pickup_code,
            'picked_at': self.picked_at.strftime('%Y-%m-%d %H:%M:%S'),
            'remark': self.remark
        }

class SavedFilter(db.Model):
    __tablename__ = 'saved_filters'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    page_name = db.Column(db.String(50), nullable=False, index=True)
    filter_name = db.Column(db.String(100), nullable=False)
    filter_data = db.Column(db.Text, nullable=False)
    is_default = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'page_name': self.page_name,
            'filter_name': self.filter_name,
            'filter_data': self.filter_data,
            'is_default': self.is_default,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }
