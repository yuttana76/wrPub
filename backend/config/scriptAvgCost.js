--Function AverageCostPerUnit

CREATE FUNCTION MIT_AverageCostPerUnit(@Ref_No  VARCHAR(50), @Fund_ID  int, @EndOfDataDate  datetime)
RETURNS @retVal TABLE
(
   AvgCostPerUnit decimal(25,8)
)
BEGIN
-- -- INPUT
-- DECLARE @Ref_No VARCHAR(100) ='M00000000229';
-- DECLARE @Fund_ID VARCHAR(100) = '185' ;
-- DECLARE @EndOfDataDate DATE ='2018-12-30';
-- -- INPUT
-- --RETURN
DECLARE @AvgCostPerUnit decimal(25,8) = 0;

DECLARE @AmtAvgCost decimal(25,8) = 0;
DECLARE @AmtUnit numeric(18, 4) = 0;
-- mfts_Transaction
DECLARE @TranType_Code [varchar](2);
DECLARE @Amount_Baht [numeric](18, 2);
DECLARE @Amount_Unit [numeric](18, 4);
DECLARE @Nav_Price [numeric](18, 4);

DECLARE @UnitOut [numeric](18, 4);
DECLARE @CostOut decimal(25,8) = 0;

DECLARE MFTS_Transaction_cursor CURSOR LOCAL  FOR
Select  TranType_Code, Amount_Baht, Amount_Unit, Nav_Price
from mfts_Transaction
where Ref_No = @Ref_No and Fund_ID = @Fund_ID and Status_ID = 7
and convert(char(10),Act_ExecDate,121) <= @EndOfDataDate
order by Act_ExecDate ,Tran_Id

    OPEN MFTS_Transaction_cursor
        FETCH NEXT FROM MFTS_Transaction_cursor INTO @TranType_Code,@Amount_Baht,@Amount_Unit,@Nav_Price

    WHILE @@FETCH_STATUS = 0
    BEGIN

        IF @TranType_Code = 'B'  OR @TranType_Code = 'SI' OR @TranType_Code = 'TI'
        BEGIN
            SET @AmtAvgCost = @AmtAvgCost + @Amount_Baht
            SET @AmtUnit = @AmtUnit + Round(@Amount_Unit, 4)
            SET @AvgCostPerUnit = Round(@AmtAvgCost / @AmtUnit, 4)
        END
        ELSE IF @TranType_Code = 'S'  OR @TranType_Code = 'SO' OR @TranType_Code = 'TO'
        BEGIN
            SET @UnitOut = @Amount_Unit
            SET @CostOut = @UnitOut * @AvgCostPerUnit

            SET @AmtUnit = @AmtUnit - @Amount_Unit
            IF @AmtUnit = 0
            BEGIN
                SET @AvgCostPerUnit = 0
                SET @AmtAvgCost = 0
            END
            ELSE BEGIN
                SET @AmtAvgCost = @AmtAvgCost - @CostOut
                SET @AvgCostPerUnit = @AmtAvgCost / @AmtUnit
            END

        END
        FETCH NEXT FROM MFTS_Transaction_cursor INTO @TranType_Code,@Amount_Baht,@Amount_Unit,@Nav_Price
    END

    CLOSE MFTS_Transaction_cursor
    DEALLOCATE MFTS_Transaction_cursor

--Return @AvgCostPerUnit
-- SELECT @AvgCostPerUnit

INSERT @retVal
        SELECT @AvgCostPerUnit

RETURN;
END
