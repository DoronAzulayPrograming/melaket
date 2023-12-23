<?php 
namespace App\Models; 
 
use DafDb as a; 
use DafCore\AutoConstruct;
use DafDb\OnDeleteAction;

class UserWarehouse extends AutoConstruct { 

    #[\DafCore\NotNullNotEmpty]
    #[\DafCore\Range(1)]
    #[a\PrimaryKey]
    #[a\ForeignKey("Users","id", OnDeleteAction::CASCADE->value)]
    public int $userId;

    #[\DafCore\NotNullNotEmpty]
    #[\DafCore\Range(1)]
    #[a\PrimaryKey]
    #[a\ForeignKey("Warehouses","id", OnDeleteAction::CASCADE->value)]
    public int $warehouseId;
    
    #[a\DbInclude("Users","Users.id = UsersWarehouses.userId")]
    public User $user;
    
    #[a\DbInclude("Warehouses","Warehouses.id = UsersWarehouses.warehouseId")]
    public Warehouse $warehouse;
}
?>