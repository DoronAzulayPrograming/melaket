<?php 
namespace App\Models\Model;

use App\Models\Business\Business;
use App\Models\Data\KonimboData;
use DafCore\AutoConstruct;
use DafCore\AutoConstruct as json;
use DafDb\DateOnly;
use DafDb as a;

class Model extends AutoConstruct { 

    #[a\PrimaryKey]
    #[a\AutoIncrement]
    public int $id;

    #[\DafCore\NotNull]
    #[a\ForeignKey('Business','id', \DafDb\OnDeleteAction::CASCADE->value)]
    public int $businessId;
    
    #[\DafCore\NotNull]
    #[a\DefaultValue(0.0)]
    public float $price;
    
    #[\DafCore\NotNull]
    #[\DafCore\Length(70)]
    #[a\DefaultValue('')]
    public string $name;

    #[json\Ignore]
    #[\DafCore\NotNull]
    #[a\DefaultValue('')]
    public string $jsonData;
    
    #[a\NotNull]
    #[a\DefaultValue('CURRENT_DATE')]
    public DateOnly $createDate;

    #[a\NotNull]
    #[a\DefaultValue('CURRENT_DATE')]
    public DateOnly $lastPayDate;

    public function setCreateDate(string $date){
        $this->createDate = new DateOnly($date);
    }

    public function setLastPayDate(string $date){
        $this->lastPayDate = new DateOnly($date);
    }

    #[a\DbInclude('Business','Business.id = Models.businessId')]
    public Business $business;

    #[a\DbIgnore]
    public $data;

    function onAfterLoad()
    {
        $models = ["קונימבו"=>KonimboData::class];
        if(isset($models[$this->name])){
            $decode = json_decode($this->jsonData,true);
            if(!count($decode)){
                $this->data = new \stdClass();
            }
            else{
                $class_name = $models[$this->name];
                $this->data = new $class_name($decode);
            }
        }
    }
}
?>