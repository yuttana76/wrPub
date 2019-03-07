Public Function ITs_AverageCostPerUnit(Ref_No As String, Fund_ID As Integer, EndOfDataDate As String) As Double
         '******** Trn In *****
                             sqlTrnIn = " Select  sum(Amount_Unit)  as AmtUnitIn " & _
                                                    " from mfts_Transaction " & _
                                                    " where Ref_No = '" & Ref_No & "' and Fund_ID = '" & Fund_ID & "' and Status_ID = 7 " & _
                                                      " and convert(char(10),Act_ExecDate,121) <= '" & EndOfDataDate & "'  " & _
                                                      " and TranType_Code in ('B','SI','TI') " & _
                                                    "  "
                             Set rsTrnInConnex = connConnex.Execute(sqlTrnIn)
                             If Not IsNull(rsTrnInConnex("AmtUnitIn")) Then
                                    AmtUnitIn = rsTrnInConnex("AmtUnitIn")
                             Else
                                     AmtUnitIn = 0
                             End If
       '******** TrnOut *****
                             sqlTrnOut = " Select  sum(Amount_Unit)  as AmtUnitOut " & _
                                                    " from mfts_Transaction " & _
                                                    " where Ref_No = '" & Ref_No & "' and Fund_ID = '" & Fund_ID & "' and Status_ID = 7 " & _
                                                      " and convert(char(10),Act_ExecDate,121) <= '" & EndOfDataDate & "'  " & _
                                                      " and TranType_Code in ('S','SO','TO') " & _
                                                    "  "
                             Set rsTrnOutConnex = connConnex.Execute(sqlTrnOut)
                             If Not IsNull(rsTrnOutConnex("AmtUnitOut")) Then
                                    AmtUnitOut = rsTrnOutConnex("AmtUnitOut")
                             Else
                                    AmtUnitOut = 0
                             End If

                            TotalBalance_Unit = AmtUnitIn - AmtUnitOut
                            If TotalBalance_Unit = 0 Then
                                 Exit Function
                            End If

'*************************
'    If Fund_ID = 429 Then
'       test = ""
'    End If
                             sqlTrn = " Select  TranType_Code, Amount_Baht,Amount_Unit  ,Nav_Price " & _
                                                    " from mfts_Transaction " & _
                                                    " where Ref_No = '" & Ref_No & "' and Fund_ID = '" & Fund_ID & "' and Status_ID = 7 " & _
                                                      " and convert(char(10),Act_ExecDate,121) <= '" & EndOfDataDate & "'  " & _
                                                      "order by Act_ExecDate ,Tran_Id "
                              Set rsTrnConnex = connConnex.Execute(sqlTrn)


                               AmtAvgCost = 0
                               AvgCostPerUnit = 0
                               AmtUnit = 0
                              Do While Not rsTrnConnex.EOF

                                        TranTypeCode = UCase(rsTrnConnex("TranType_Code"))
                                        If TranTypeCode = "B" Or TranTypeCode = "SI" Or TranTypeCode = "TI" Then
                                                      AmtAvgCost = AmtAvgCost + rsTrnConnex("Amount_Baht")
                                                        AmtUnit = AmtUnit + Round(rsTrnConnex("Amount_Unit"), 4)
                                                         AvgCostPerUnit = Round(AmtAvgCost / AmtUnit, 4)
                                        End If
                                        If TranTypeCode = "S" Or TranTypeCode = "SO" Or TranTypeCode = "TO" Then
                                                          UnitOut = rsTrnConnex("Amount_Unit")
                                                           CostOut = UnitOut * AvgCostPerUnit

                                                         AmtUnit = AmtUnit - rsTrnConnex("Amount_Unit")
                                                         If AmtUnit = 0 Then
                                                              AvgCostPerUnit = 0
                                                                AmtAvgCost = 0
                                                         Else
                                                              AmtAvgCost = AmtAvgCost - CostOut
                                                             AvgCostPerUnit = Round(AmtAvgCost / AmtUnit, 4)
                                                           End If
                                        End If

                                    rsTrnConnex.MoveNext
                                    Loop
skiploop:
                       ITs_AverageCostPerUnit = AvgCostPerUnit


        Set rsTrnConnex = Nothing
         Set rsTrnOutConnex = Nothing
          Set rsTrnInConnex = Nothing
End Function
