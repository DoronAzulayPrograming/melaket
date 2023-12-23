<?php 
namespace App\Models\Business;

use App\Models\Data\KonimboData;
use DafCore\AutoConstruct; 
use DafDb\DateOnly;

class BusinessModalCreateModel extends AutoConstruct { 

    public int $id;
    public int $businessId;
    
    #[\DafCore\NotNullNotEmpty]
    public float $price;
    
    #[\DafCore\NotNullNotEmpty]
    #[\DafCore\Length(70)]
    #[\DafCore\In(["קונימבו"])]
    public string $name;

    #[\DafCore\NotNullNotEmpty]
    #[\DafCore\Json]
    public string $jsonData;
    
    public DateOnly $createDate;

    public DateOnly $lastPayDate;

    public function setCreateDate(string $date){
        $this->createDate = new DateOnly($date);
    }

    public function setLastPayDate(string $date){
        $this->lastPayDate = new DateOnly($date);
    }

    public function onAfterLoad()
    {
        $this->id = 0;
        $this->businessId = 0;
        $this->createDate = DateOnly::Now();
        $this->lastPayDate = DateOnly::Now();
    }
}
?>