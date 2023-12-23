<?php 
namespace App\Models\Data;

use App\Models\Data\KonimboWarehouse;
use DafCore\AutoConstruct; 

class KonimboData extends AutoConstruct { 
    
    public int $codeBinaPaypalCashier;
    
    #[\DafCore\NotNullNotEmpty]
    #[\DafCore\Range(1)]
    public int $codeBinaCreditCashier;
    
    #[\DafCore\NotNullNotEmpty]
    public string $codeBinaDiscountItemNumber;

    #[\DafCore\NotNullNotEmpty]
    public string $codeBinaPointItemNumber;

    #[\DafCore\NotNullNotEmpty]
    public string $codeBinaB2CItemNumber;

    #[\DafCore\NotNullNotEmpty]
    public string $codeBinaB2CHarigItemNumber;
    
    #[\DafCore\NotNullNotEmpty]
    public string $codeBinaPickupItemNumber;

    #[\DafCore\NotNullNotEmpty]
    public int $codeBinaCustomerNo;



    #[\DafCore\NotNullNotEmpty]
    public string $shopName;
    
    #[\DafCore\NotNullNotEmpty]
    public string $shopUrl;

    #[\DafCore\NotNullNotEmpty]
    public string $subDomain;

    #[\DafCore\NotNullNotEmpty]
    #[\DafCore\In(["cheetah"])]
    public string $shippingCompany;

    #[\DafCore\NotNullNotEmpty]
    public string $shippingToken;
    
    #[\DafCore\NotNullNotEmpty]
    #[\DafCore\Length(128,64)]
    public string $orderToken;
    
    #[\DafCore\NotNullNotEmpty]
    #[\DafCore\Length(128,64)]
    public string $itemsToken;

    #[\DafCore\NotNullNotEmpty]
    #[\DafCore\Length(128,64)]
    public string $debitToken;

    
    public string $cancelOrderReasons;

    #[\DafCore\NotNullNotEmpty]
    public string $finalOrderStatus;

    #[\DafCore\NotNullNotEmpty]
    public string $failedOrderStatus;



    #[\DafCore\NotNullNotEmpty]
    public string $sendGridToken;

    #[\DafCore\NotNullNotEmpty]
    #[\DafCore\Email]
    public string $sendGridEmail;

    #[\DafCore\NotNullNotEmpty]
    public string $sendGridTemplatePickup;

    #[\DafCore\NotNullNotEmpty]
    public string $sendGridTemplatePoint;

    #[\DafCore\NotNullNotEmpty]
    public string $sendGridTemplateB2C;

    #[\DafCore\NotNullNotEmpty]
    public string $sendGridSignature;
    
    
    #[\DafCore\NotNullNotEmpty]
    #[\DafCore\ArrayValidateClass(KonimboWarehouse::class)]
    public array $warehouses;
}
?>