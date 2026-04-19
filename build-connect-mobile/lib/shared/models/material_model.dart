class MaterialGroup {
  final String id;
  final String name;
  final String? icon;
  final int sortOrder;

  MaterialGroup({required this.id, required this.name, this.icon, required this.sortOrder});

  factory MaterialGroup.fromJson(Map<String, dynamic> json) {
    return MaterialGroup(
      id: json['id'],
      name: json['name'],
      icon: json['icon'],
      sortOrder: json['sort_order'] ?? 0,
    );
  }
}

class MaterialItem {
  final String id;
  final String groupId;
  final String name;
  final String? description;
  final int sortOrder;

  MaterialItem({required this.id, required this.groupId, required this.name, this.description, required this.sortOrder});

  factory MaterialItem.fromJson(Map<String, dynamic> json) {
    return MaterialItem(
      id: json['id'],
      groupId: json['group_id'],
      name: json['name'],
      description: json['description'],
      sortOrder: json['sort_order'] ?? 0,
    );
  }
}

class BusinessMaterial {
  final String id;
  final String businessId;
  final String materialItemId;
  final String? customDescription;
  final MaterialItem? materialItems;

  BusinessMaterial({required this.id, required this.businessId, required this.materialItemId, this.customDescription, this.materialItems});

  factory BusinessMaterial.fromJson(Map<String, dynamic> json) {
    return BusinessMaterial(
      id: json['id'] ?? '',
      businessId: json['business_id'] ?? '',
      materialItemId: json['material_item_id'] ?? '',
      customDescription: json['custom_description'],
      materialItems: json['material_items'] != null ? MaterialItem.fromJson(json['material_items']) : null,
    );
  }
}
