<?php 
namespace App\Models\Model; 
 
use DafCore\AutoConstruct; 
use DafDb\DateOnly;

class ModelCreateModel extends AutoConstruct { 

    public int $id;

    #[\DafCore\DisplayName("מזהה עסק")]
    #[\DafCore\NotNull]
    #[\DafCore\Range(min:1)]
    public int $businessId;
    
    #[\DafCore\DisplayName("מחיר")]
    #[\DafCore\Range(min:1)]
    public float $price;
    
    #[\DafCore\DisplayName("שם")]
    #[\DafCore\NotNullNotEmpty]
    #[\DafCore\Length(70)]
    #[\DafCore\In(["קונימבו"])]
    public string $name;

    #[\DafCore\DisplayName("נתוים נוספים")]
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
        $this->createDate = DateOnly::Now();
        $this->lastPayDate = DateOnly::Now();
    }
}
?>