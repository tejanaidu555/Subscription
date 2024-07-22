import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Grid,
  TextField,
  Typography,
  Card,
  CardContent,
} from '@mui/material';

const Subscriptions = ({ userId, history }) => {
  const [selectedPlan, setSelectedPlan] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [pricing, setPricing] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pricePerMonth, setPricePerMonth] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);
  const [customMonths, setCustomMonths] = useState('');
  const company = sessionStorage.getItem('userId');

  useEffect(() => {
    fetchOwnerName(userId);
  }, [userId]);

  const fetchOwnerName = (company) => {
    fetch(`http://localhost:1001/ems/getById/${company}`)
      .then(response => response.json())
      .then(data => {
        setOwnerName(data.ownerName);
      })
      .catch(error => {
        console.error('Error fetching ownerName:', error);
      });
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    if (plan !== 'custom') {
      getPricing(plan);
      calculateDateRange(plan);
    }
  };

  const handleCustomInputChange = (e) => {
    setCustomMonths(e.target.value);
  };

  const handleCustomSubmit = () => {
    if (customMonths > 0) {
      const customTotalPrice = 13000; 
      const customFinalPrice = customTotalPrice;
      const months = parseInt(customMonths);
      const customPricePerMonth = customTotalPrice / months;
      setPricePerMonth(customPricePerMonth);
      setDiscount(0);
      setFinalPrice(customFinalPrice);
    }
  };

  const getPricing = (plan) => {
    fetch(`http://localhost:8005/pricing/pricing/${plan}`)
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error('Failed to fetch pricing information');
        }
      })
      .then(data => {
        setPricing(data);
        calculateTotalPrice(data);
      })
      .catch(error => {
        console.error('Error fetching pricing:', error);
      });
  };

  const calculateDateRange = (plan) => {
    const today = new Date();
    let endDate = '';

    switch (plan) {
      case 'monthly':
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'quarterly':
        endDate = new Date(today.getFullYear(), today.getMonth() + 3, 0);
        break;
      case 'yearly':
        endDate = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
        break;
      default:
        break;
    }

    setStartDate(today.toLocaleDateString());
    setEndDate(endDate.toLocaleDateString());
  };

  const calculateTotalPrice = (pricingData) => {
    if (pricingData) {
      const price = pricingData.price;
      const discount = pricingData.discount;
      const finalPrice = price - (price * discount) / 100;
      setPricePerMonth(price);
      setDiscount(discount);
      setFinalPrice(finalPrice);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const formattedStartDate = new Date(startDate).toISOString();
    const formattedEndDate = new Date(endDate).toISOString();

    const subscriptionData = {
      plan: selectedPlan,
      userId: company,
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      totalPrice: pricePerMonth,
      discount: discount,
      finalPrice: finalPrice,
    };
    localStorage.setItem('subscriptionData', JSON.stringify(subscriptionData));

    fetch('http://localhost:8005/subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscriptionData),
    })
      .then(response => response.json())
      .then(data => {
        if (data.ok) {
          history.push('/Payment');
        } else {
          throw new Error('Failed to create subscription');
        }
      })
      .catch(error => {
        console.error('Error creating subscription:', error);
      });
  };

  return (
    <Container maxWidth="md">
      <Typography align="center" variant="h4" gutterBottom>
        Welcome, {ownerName}!
      </Typography>
      <Typography align="center" variant="h5" gutterBottom>
        Choose Your Subscription Plan
      </Typography>
      <Grid container spacing={3} justifyContent="center">
        {['monthly', 'quarterly', 'yearly', 'custom'].map((plan) => (
          <Grid item xs={12} sm={6} md={3} key={plan}>
            <Card
              onClick={() => handlePlanSelect(plan)}
              style={{
                border: selectedPlan === plan ? '2px solid blue' : '1px solid #ccc',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <CardContent>
                <Typography variant="h6">
                  {plan.charAt(0).toUpperCase() + plan.slice(1)}
                </Typography>
                {pricing && selectedPlan !== 'custom' && (
                  <Typography>
                    Price: ₹{pricing.price}, Discount: {pricing.discount}%
                  </Typography>
                )}
                {plan === 'custom' && (
                  <Box display="flex" alignItems="center">
                    <TextField
                      type="number"
                      placeholder="Enter months"
                      value={customMonths}
                      onChange={handleCustomInputChange}
                      margin="normal"
                      style={{ marginRight: '1rem' }}
                    />
                    <Button style={{marginLeft:'-3%',width:"130%"}} variant="contained" onClick={handleCustomSubmit}>
                      Calculate
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box mt={4} textAlign="center">
        <Typography variant="h6">Date Range:</Typography>
        <Typography>Start Date: {startDate}</Typography>
        <Typography>End Date: {endDate}</Typography>
      </Box>

      <Box mt={2} textAlign="center">
        <Typography variant="h6">Total Price:</Typography>
        <Typography>Price Per Month: ₹{pricePerMonth}, Discount: {discount}%</Typography>
        <Typography variant="h4" color="primary">Final Price: ₹{finalPrice}</Typography>
      </Box>

      <Box mt={4} display="flex" justifyContent="center">
        <Button variant="contained" color="primary" onClick={handleSubmit}>
          Subscribe Now
        </Button>
        <Link to="/Payment" style={{ textDecoration: 'none', marginLeft: '1rem' }}>
          <Button variant="contained" color="secondary">
            Proceed to Payment
          </Button>
        </Link>
      </Box>
    </Container>
  );
};

export default Subscriptions;
