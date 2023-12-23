<?php 
namespace App\Models\BackgroundData; 
 
use DafDb as a; 
use DafCore\AutoConstruct;
use DafCore\AutoConstruct as json;
use DafDb\OnDeleteAction;

class CodebinaModel extends AutoConstruct { 

    #[a\PrimaryKey]
    #[a\Length(128)]
    public string $ItemNo;

    #[a\ForeignKey("Business", "id", OnDeleteAction::CASCADE->value)]
    public int $businessId;

    #[a\NotNull]
    #[a\Length(128)]
    #[a\DefaultValue('')]
    public string $Barcode;
    
    #[a\NotNull]
    #[a\DefaultValue(0)]
    public float $SalePrice;
    
    #[a\NotNull]
    #[a\Length(32)]
    #[a\DefaultValue('')]
    public string $WareHousePos;
    
    #[a\NotNull]
    #[a\DefaultValue('')]
    public string $Stock;

    #[json\Name("Stock")]
    #[a\DbIgnore]
    public array $StockArr;

    public function onAfterLoad()
    {
        if($this->Stock){
            $this->StockArr = [];
            $list = json_decode($this->Stock, true);
            foreach ($list as $item) {
                $this->StockArr[] = $item;
            }
        }
    }
}
?>