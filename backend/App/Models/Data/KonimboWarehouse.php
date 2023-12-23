<?php 
namespace App\Models\Data; 
 
use DafCore\AutoConstruct; 
 
class KonimboWarehouse extends AutoConstruct { 

    #[\DafCore\NotNullNotEmpty]
    #[\DafCore\Range(1)]
    public int $warehouseId;

    #[\DafCore\NotNullNotEmpty]
    public string $address;

    #[\DafCore\NotNullNotEmpty]
    public int $pickupKonimboId;

    #[\DafCore\NotNullNotEmpty]
    public string $orderStatus;

    #[\DafCore\NotNullNotEmpty]
    public string $pickupStatus;

    #[\DafCore\NotNullNotEmpty]
    public string $shippingAuth;
    
    #[\DafCore\NotNullNotEmpty]
    #[\DafCore\Range(1)]
    public int $orderPriority;
    
    #[\DafCore\NotNull]
    public bool $orderEnable;
}
?>