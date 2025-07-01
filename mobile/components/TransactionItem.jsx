import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { styles } from "../assets/styles/home.styles";
import { COLORS } from "../constants/colors";
import { formatDate } from "../lib/utils";

const CATEGORY_ICONS = {
  "Food & Drinks": "fast-food",
  Shopping: "cart",
  Transportation: "car",
  Entertainment: "film",
  Bills: "receipt",
  Income: "cash",
  Other: "ellipsis-horizontal",
};

export const TransactionItem = ({item, onDelete}) => {
  // Add defensive checks for item and item.amount
  const amount = item && item.amount ? parseFloat(item.amount) : 0;
  const isIncome = amount > 0;
  const iconName = item && item.category ? (CATEGORY_ICONS[item.category] || "pricetag-outline") : "pricetag-outline";

  // If item is not defined, return null
  if (!item) {
    return null;
  }

  return (
    <View style={styles.transactionCard} key={item.id}>
      <TouchableOpacity style={styles.transactionContent}>
        <View style={styles.categoryIconContainer}>
          <Ionicons name={iconName} size={22} color={isIncome ? COLORS.income : COLORS.expense} />
        </View>
        <View style={styles.transactionLeft}>
          <Text style={styles.transactionTitle}>{item.title}</Text>
          <Text style={styles.transactionCategory}>{item.category}</Text>
        </View>
        <View style={styles.transactionRight}>
          <Text 
            style={[styles.transactionAmount, {color: isIncome ? COLORS.income : COLORS.expense}]}
          >
            {isIncome ? "+" : "-"}₹{Math.abs(amount).toFixed(2)}
          </Text>
          <Text style={styles.transactionDate}>{formatDate(item.created_at)}</Text>
        </View> 
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteButton} onPress={()=> onDelete(item.id)}>
        <Ionicons name="trash-outline" size={20} color={COLORS.expense} />
      </TouchableOpacity>
    </View>
  )
}