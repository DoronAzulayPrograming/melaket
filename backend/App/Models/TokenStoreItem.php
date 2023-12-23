<?php 
namespace App\Models; 
 
use DafCore\AutoConstruct; 
use DafDb as a;
use DafDb\OnDeleteAction;

class TokenStoreItem extends AutoConstruct { 

    #[\DafCore\NotNullNotEmpty]
    #[a\PrimaryKey]
    public string $token;
    
    #[\DafCore\NotNullNotEmpty]
    #[\DafCore\Range(1)]
    #[a\NotNull]
    #[a\ForeignKey("Users","id",OnDeleteAction::CASCADE->value)]
    public string $userId;

    #[\DafCore\NotNullNotEmpty]
    #[a\NotNull]
    #[a\DefaultValue('')]
    public string $expireTime;
}
?>