<?php 
namespace App\Models\BackgroundData; 
 
use DafDb as a; 
use DafCore\AutoConstruct;
use DafDb\OnDeleteAction;

class KonimboModel extends AutoConstruct { 

    #[a\PrimaryKey]
    #[a\Length(128)]
    public string $id;
    
    #[a\ForeignKey("Business", "id", OnDeleteAction::CASCADE->value)]
    public int $businessId;
    
    #[a\NotNull]
    #[a\DefaultValue(0)]
    public float $price;
    
    #[a\NotNull]
    #[a\Length(128)]
    #[a\DefaultValue('')]
    public string $second_code;

    #[a\NotNull]
    #[a\DefaultValue('')]
    public string $image;

}
?>